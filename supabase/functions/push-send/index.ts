// Internal push fan-out. Accepts a recipient spec + notification payload,
// fetches matching push_subscriptions, and delivers via Web Push (VAPID).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC =
  'BJYhxg5aa5PCz1C0Hq3tEZuQe4OUibYESkOQqWjUtwppF0dRnht-qA5yZePqwXlYYjgDBvKp20CRHsSUY17MlDA';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@hextech.local';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

interface SendBody {
  target: { role?: 'admin' | 'customer'; user_id?: string };
  notification: { title: string; body: string; url?: string; tag?: string };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = (await req.json()) as SendBody;
    if (!body?.target || !body?.notification?.title) {
      return new Response(JSON.stringify({ error: 'invalid payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);
    let q = supa.from('push_subscriptions').select('id, endpoint, subscription, user_id');
    if (body.target.user_id) q = q.eq('user_id', body.target.user_id);
    else if (body.target.role) q = q.eq('role', body.target.role);
    const { data: subs, error } = await q;
    if (error) throw error;

    const payload = JSON.stringify(body.notification);
    const results = await Promise.allSettled(
      (subs ?? []).map((row: any) =>
        webpush.sendNotification(row.subscription, payload).catch(async (err: any) => {
          // Clean up dead subscriptions
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await supa.from('push_subscriptions').delete().eq('id', row.id);
          }
          throw err;
        })
      )
    );
    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return new Response(JSON.stringify({ sent, total: subs?.length ?? 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[push-send]', e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
