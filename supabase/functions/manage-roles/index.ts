// Admin-only edge function for managing user_roles by email.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(url, serviceKey);

    // Validate caller
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = userData.user.id;

    const { data: isAdminData } = await admin.rpc('has_role', { _user_id: callerId, _role: 'admin' });
    if (!isAdminData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === 'list') {
      // List customers — paginate through users + their roles
      const { data: usersPage, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (listErr) throw listErr;
      const { data: roles } = await admin.from('user_roles').select('user_id, role');
      const rolesByUser = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role);
        rolesByUser.set(r.user_id, arr);
      });
      const out = usersPage.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        roles: rolesByUser.get(u.id) ?? [],
      }));
      return new Response(JSON.stringify({ users: out }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const email = (body.email as string | undefined)?.trim().toLowerCase();
    const role = body.role as string | undefined;
    if (!email || !role || !['customer', 'admin', 'moderator', 'user'].includes(role)) {
      return new Response(JSON.stringify({ error: 'email and valid role required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find user by email
    const { data: usersPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const target = usersPage.users.find((u) => u.email?.toLowerCase() === email);
    if (!target) {
      return new Response(JSON.stringify({ error: `No user found with email ${email}` }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'grant') {
      const { error } = await admin
        .from('user_roles')
        .insert({ user_id: target.id, role })
        .select();
      if (error && !error.message.includes('duplicate')) throw error;
      return new Response(JSON.stringify({ ok: true, user_id: target.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'revoke') {
      const { error } = await admin
        .from('user_roles')
        .delete()
        .eq('user_id', target.id)
        .eq('role', role);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, user_id: target.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
