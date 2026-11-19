// This function is deliberately restricted to EcoCash's simulated sandbox.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { classifyOutcome, explainFailure } from './outcome.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const base = 'https://developers.ecocash.co.zw/sandbox/payment/v1';
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { ...cors, 'Content-Type': 'application/json' },
  });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth } = await admin.auth.getUser(jwt);
    if (!auth.user) return json({ error: 'Sign in to continue.' }, 401);
    const userId = auth.user.id;
    const username = Deno.env.get('ECOCASH_SANDBOX_USERNAME');
    const password = Deno.env.get('ECOCASH_SANDBOX_PASSWORD');
    const merchantCode = Deno.env.get('ECOCASH_SANDBOX_MERCHANT_CODE');
    const merchantNumber = Deno.env.get('ECOCASH_SANDBOX_MERCHANT_NUMBER');
    const merchantPin = Deno.env.get('ECOCASH_SANDBOX_MERCHANT_PIN');
    if (!username || !password || !merchantCode || !merchantNumber || !merchantPin)
      return json({ error: 'EcoCash sandbox is not configured.' }, 503);
    const authHeader = 'Basic ' + btoa(username + ':' + password);
    const body = await req.json();
    let attempt;
    if (body.action === 'check') {
      const result = await admin.from('ecocash_test_payments').select('*')
        .eq('id', body.id).eq('user_id', userId).maybeSingle();
      if (result.error || !result.data) return json({ error: 'Test payment not found.' }, 404);
      attempt = result.data;
      if (attempt.status !== 'pending') return json({ payment: attempt });
    } else if (body.action === 'start') {
      const phone = String(body.phone ?? '').replace(/[\s+-]/g, '').replace(/^263/, '').replace(/^0/, '');
      const amount = Number(body.amount);
      if (!/^7\d{8}$/.test(phone) || !Number.isFinite(amount) || amount < 0.01 || amount > 10000 || Math.abs(Math.round(amount * 100) - amount * 100) > 1e-8)
        return json({ error: 'Enter a valid Zimbabwean mobile number and amount.' }, 400);
      const result = await admin.from('ecocash_test_payments').insert({ user_id: userId, phone, amount }).select().single();
      if (result.error) return json({ error: 'A test payment is already pending. Check its status before starting another.' }, 409);
      attempt = result.data;
    } else return json({ error: 'Unknown action.' }, 400);

    let response: Response;
    try {
      response = body.action === 'start'
        ? await fetch(base + '/transactions/amount/', {
          method: 'POST', headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientCorrelator: attempt.id, referenceCode: attempt.id, tranType: 'MER',
            endUserId: attempt.phone,
            paymentAmount: { charginginformation: { amount: attempt.amount, currency: 'USD', description: 'Hextech sandbox test' },
              chargeMetaData: { channel: 'WEB', purchaseCategoryCode: 'Online Payment', onBeHalfOf: 'ECOCASH' } },
            merchantCode, merchantPin, merchantNumber, countryCode: 'ZW',
            terminalID: Deno.env.get('ECOCASH_SANDBOX_TERMINAL_ID') ?? 'UAT00003',
            location: Deno.env.get('ECOCASH_SANDBOX_LOCATION') ?? 'Harare',
            superMerchantName: 'ECOCASH',
            merchantName: Deno.env.get('ECOCASH_SANDBOX_MERCHANT_NAME') ?? 'UAT STORE 3',
          }),
        })
        : await fetch(base + '/' + encodeURIComponent(attempt.phone) + '/transactions/amount/' + encodeURIComponent(attempt.id),
          { headers: { Authorization: authHeader } });
    } catch {
      return json({ payment: attempt, message: 'The outcome is unknown. Check the status before trying again.' });
    }
    const result = await response.json().catch(() => ({}));
    console.log(JSON.stringify({ action: body.action, httpStatus: response.status,
      responseCode: result.responseCode ?? null, operationStatus: result.transactionOperationStatus ?? null }));
    // Never mark a transaction successful based on a client-provided callback.
    const outcome = classifyOutcome(response.status, result, attempt.id, body.action);
    const charged = outcome === 'charged';
    const failed = outcome === 'failed';
    const failureReason = explainFailure(response.status, result.ecocashResponseCode, result.responseMessage);
    if (charged || failed) {
      const update = await admin.from('ecocash_test_payments')
        .update({ status: charged ? 'charged' : 'failed', ecocash_reference: charged ? result.ecocashReference ?? null : null, failure_reason: failed ? failureReason : null, updated_at: new Date().toISOString() })
        .eq('id', attempt.id).eq('status', 'pending').select().maybeSingle();
      if (update.error) return json({ error: 'The outcome could not be saved. Check status again.' }, 500);
      if (update.data) attempt = update.data;
    }
    return json({ payment: attempt, message: attempt.status === 'pending' ? 'Outcome not confirmed. Check status before trying again.' : undefined });
  } catch {
    return json({ error: 'Unable to process the sandbox request.' }, 500);
  }
});
