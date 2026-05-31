// Scans customer_billing and fires:
//  - 7-day expiry notice to the specific client (once)
//  - expiry notice to the client + all admins (once)
// Idempotent: uses seven_day_notified / expiry_notified flags.
// Triggered by pg_cron daily and on admin dashboard load.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function atMidnight(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function parseDateKey(s: string | null): Date | null {
  if (!s) return null;
  const p = String(s).slice(0,10).split('-').map(Number);
  if (p.length !== 3) return null;
  const [y,m,day] = p;
  return atMidnight(new Date(y, m-1, day));
}

function computeRenewal(billingDay: number | null, lastPaid: string | null, today: Date) {
  if (!billingDay || billingDay < 1 || billingDay > 28) return null;
  const paid = parseDateKey(lastPaid);
  let start: Date;
  if (paid) start = paid;
  else {
    const thisMonth = atMidnight(new Date(today.getFullYear(), today.getMonth(), billingDay));
    start = today >= thisMonth ? thisMonth : atMidnight(new Date(today.getFullYear(), today.getMonth()-1, billingDay));
  }
  return atMidnight(new Date(start.getFullYear(), start.getMonth()+1, billingDay));
}

async function pushSend(supa: any, body: any) {
  await fetch(`${SUPABASE_URL}/functions/v1/push-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_ROLE}` },
    body: JSON.stringify(body),
  }).catch((e) => console.error('[check-exp push-send]', e));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: rows, error } = await supa
      .from('customer_billing')
      .select('user_id, account_id, billing_day, last_paid_date, monthly_fee, balance, account_state, expiry_notified, seven_day_notified');
    if (error) throw error;

    const today = atMidnight(new Date());
    const MS_DAY = 1000*60*60*24;
    const results: any[] = [];

    // Build a lookup for names
    const userIds = (rows ?? []).map((r:any) => r.user_id);
    const { data: profs } = await supa.from('profiles').select('user_id, full_name, email').in('user_id', userIds);
    const nameMap = new Map((profs ?? []).map((p:any) => [p.user_id, p.full_name || p.email || 'Client']));

    for (const r of rows ?? []) {
      if (['suspended','pending'].includes((r.account_state ?? '').toLowerCase())) continue;
      const renewal = computeRenewal(r.billing_day, r.last_paid_date, today);
      if (!renewal) continue;
      const days = Math.ceil((renewal.getTime() - today.getTime()) / MS_DAY);
      const name = nameMap.get(r.user_id) || 'Client';
      const acct = r.account_id ?? r.user_id.slice(0,6);
      const renewalStr = renewal.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      // Expired
      if (days <= 0 && !r.expiry_notified) {
        await pushSend(supa, {
          target: { role: 'admin' },
          notification: {
            title: '⚠️ Subscription Expired',
            body: `${name} (${acct}) — subscription expired today.\nOutstanding: $${Number(r.monthly_fee).toFixed(2)}`,
            url: `/admin?tab=customers&customer=${r.user_id}`,
            tag: `expired-${r.user_id}`,
          },
        });
        await pushSend(supa, {
          target: { user_id: r.user_id },
          notification: {
            title: '🔴 Subscription Expired',
            body: 'Your Hextech subscription has expired.\nRenew now to restore your internet connection.',
            url: '/portal',
            tag: `expired-${r.user_id}`,
          },
        });
        await supa.from('customer_billing')
          .update({
            expiry_notified: true,
            account_state: 'expired',
            balance: Number(r.monthly_fee),
          })
          .eq('user_id', r.user_id);
        results.push({ user_id: r.user_id, event: 'expired' });
        continue;
      }

      // 7-day notice
      if (days > 0 && days <= 7 && !r.seven_day_notified) {
        await pushSend(supa, {
          target: { user_id: r.user_id },
          notification: {
            title: '⏳ Subscription Expiring Soon',
            body: `Your Hextech subscription expires in ${days} day${days===1?'':'s'} on ${renewalStr}.\nRenew now to avoid losing your connection.`,
            url: '/portal',
            tag: `expiring-${r.user_id}`,
          },
        });
        await supa.from('customer_billing')
          .update({ seven_day_notified: true })
          .eq('user_id', r.user_id);
        results.push({ user_id: r.user_id, event: '7-day' });
      }
    }

    return new Response(JSON.stringify({ checked: rows?.length ?? 0, fired: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[check-expirations]', e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
