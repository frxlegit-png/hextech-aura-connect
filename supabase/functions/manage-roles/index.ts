// Admin-only edge function for managing users, roles, and customer billing.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const friendlyPwd = (raw: string) =>
    /pwned|leaked|compromis|weak|breach|hibp/i.test(raw)
      ? 'This password has been found in a known data breach. Choose a stronger, unique password.'
      : /short|length|at least/i.test(raw)
      ? 'Password is too short. Use at least 8 characters.'
      : raw;

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) return json({ error: 'Missing auth' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(url, serviceKey);

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: 'Invalid token' }, 401);
    const callerId = userData.user.id;

    const { data: isAdminData } = await admin.rpc('has_role', { _user_id: callerId, _role: 'admin' });
    if (!isAdminData) return json({ error: 'Forbidden' }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    // ----- LIST -----
    if (action === 'list') {
      const { data: usersPage, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (listErr) throw listErr;

      const { data: roles } = await admin.from('user_roles').select('user_id, role');
      const { data: profiles } = await admin.from('profiles').select('user_id, full_name, email, phone');
      const { data: billing } = await admin.from('customer_billing').select('*');
      const { data: creds } = await admin.from('customer_credentials').select('user_id, password_plain');

      const rolesByUser = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role); rolesByUser.set(r.user_id, arr);
      });
      const profileByUser = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
      const billingByUser = new Map((billing ?? []).map((b: any) => [b.user_id, b]));
      const credsByUser = new Map((creds ?? []).map((c: any) => [c.user_id, c.password_plain]));

      const out = usersPage.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        roles: rolesByUser.get(u.id) ?? [],
        profile: profileByUser.get(u.id) ?? null,
        billing: billingByUser.get(u.id) ?? null,
        password_plain: credsByUser.get(u.id) ?? null,
      }));
      return json({ users: out });
    }

    // ----- CREATE USER -----
    if (action === 'create') {
      const email = (body.email as string | undefined)?.trim().toLowerCase();
      const password = (body.password as string | undefined) ?? '';
      const fullName = (body.full_name as string | undefined) ?? '';
      const role = (body.role as string | undefined) ?? 'customer';
      if (!email) return json({ error: 'Email required' }, 400);
      if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400);

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: fullName },
      });
      if (createErr) {
        const raw = createErr.message ?? 'Could not create user';
        const friendly = /already.*registered|exists/i.test(raw)
          ? 'A user with that email already exists.'
          : friendlyPwd(raw);
        return json({ error: friendly }, 400);
      }
      const uid = created.user!.id;
      await admin.from('user_roles').insert({ user_id: uid, role }).select();
      // Save plaintext password copy for admin reveal + seed billing row
      const accountId = `HXT-${String(Math.floor(10000 + Math.random() * 89999))}`;
      await admin.from('customer_billing').upsert({
        user_id: uid,
        account_id: accountId,
      }, { onConflict: 'user_id' });
      await admin.from('customer_credentials').upsert({ user_id: uid, password_plain: password }, { onConflict: 'user_id' });
      return json({ ok: true, user_id: uid });
    }

    // For everything else we need a target user
    const targetUserId = body.user_id as string | undefined;
    const email = (body.email as string | undefined)?.trim().toLowerCase();

    let target: { id: string; email?: string } | null = null;
    if (targetUserId) {
      const { data } = await admin.auth.admin.getUserById(targetUserId);
      if (data?.user) target = { id: data.user.id, email: data.user.email ?? undefined };
    } else if (email) {
      const { data: usersPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const u = usersPage.users.find((x) => x.email?.toLowerCase() === email);
      if (u) target = { id: u.id, email: u.email ?? undefined };
    }

    if (action === 'set_password') {
      const password = (body.password as string | undefined) ?? '';
      if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400);
      if (!target) return json({ error: 'User not found' }, 404);
      const { error: updErr } = await admin.auth.admin.updateUserById(target.id, { password });
      if (updErr) return json({ error: friendlyPwd(updErr.message ?? '') }, 400);
      return json({ ok: true });
    }

    if (!target) return json({ error: 'User not found' }, 404);

    if (action === 'grant') {
      const role = (body.role as string | undefined) ?? 'customer';
      const { error } = await admin.from('user_roles').insert({ user_id: target.id, role });
      if (error && !error.message.includes('duplicate')) throw error;
      return json({ ok: true });
    }

    if (action === 'revoke') {
      const role = (body.role as string | undefined) ?? 'customer';
      const { error } = await admin.from('user_roles').delete().eq('user_id', target.id).eq('role', role);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === 'delete_user') {
      await admin.from('customer_billing').delete().eq('user_id', target.id);
      const { error } = await admin.auth.admin.deleteUser(target.id);
      if (error) throw error;
      return json({ ok: true });
    }

    // ----- UPDATE CUSTOMER DETAILS (name/email/phone) -----
    if (action === 'update_customer') {
      const fullName = body.full_name as string | undefined;
      const phone = body.phone as string | undefined;
      const newEmail = (body.new_email as string | undefined)?.trim().toLowerCase();

      if (newEmail && newEmail !== target.email) {
        const { error: emailErr } = await admin.auth.admin.updateUserById(target.id, { email: newEmail, email_confirm: true });
        if (emailErr) return json({ error: emailErr.message }, 400);
      }
      if (fullName !== undefined) {
        await admin.auth.admin.updateUserById(target.id, { user_metadata: { full_name: fullName } });
      }
      await admin.from('profiles').upsert({
        user_id: target.id,
        email: newEmail ?? target.email,
        full_name: fullName,
        phone,
      }, { onConflict: 'user_id' });
      return json({ ok: true });
    }

    // ----- UPDATE BILLING CYCLE -----
    if (action === 'update_billing') {
      const payload: Record<string, unknown> = { user_id: target.id };
      const fields = ['account_id', 'billing_day', 'account_state', 'balance', 'monthly_fee', 'signal_strength', 'station_model', 'ip_address', 'frequency'];
      for (const f of fields) if (body[f] !== undefined) payload[f] = body[f];
      const { error } = await admin.from('customer_billing').upsert(payload, { onConflict: 'user_id' });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
