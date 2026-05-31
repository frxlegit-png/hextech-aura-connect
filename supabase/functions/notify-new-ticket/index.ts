// Called by the client right after submitting a support ticket.
// Fans out a push notification to every admin subscription.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { ticket_id } = await req.json();
    if (!ticket_id) {
      return new Response(JSON.stringify({ error: 'ticket_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: ticket } = await supa
      .from('tickets')
      .select('id, ticket_code, customer_name, subject, user_id')
      .eq('id', ticket_id)
      .maybeSingle();
    if (!ticket) {
      return new Response(JSON.stringify({ error: 'ticket not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    let accountId: string | null = null;
    if (ticket.user_id) {
      const { data: cb } = await supa
        .from('customer_billing').select('account_id').eq('user_id', ticket.user_id).maybeSingle();
      accountId = cb?.account_id ?? null;
    }
    const idLabel = accountId ?? ticket.ticket_code ?? ticket.id.slice(0, 6);
    const notification = {
      title: '🎫 New Support Ticket',
      body: `${ticket.customer_name ?? 'Client'} (${idLabel}) — ${ticket.subject}\nTap to view ticket.`,
      url: `/admin?tab=tickets&ticket=${ticket.id}`,
      tag: `ticket-${ticket.id}`,
    };
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/push-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_ROLE}` },
      body: JSON.stringify({ target: { role: 'admin' }, notification }),
    });
    const out = await resp.json();
    return new Response(JSON.stringify(out), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[notify-new-ticket]', e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
