import { supabase } from '@/integrations/supabase/client';
import { currentCycleStart, formatDateKey } from './billing';

interface EnsureArgs {
  user_id: string;
  billing_day: number | null;
  monthly_fee: number;
  plan?: string;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
}

/** Ensure an invoice exists for the current billing cycle of the given user. */
export async function ensureCurrentCycleInvoice(args: EnsureArgs): Promise<void> {
  if (!args.billing_day) return;
  const cycleStart = currentCycleStart(args.billing_day);
  const dateStr = formatDateKey(cycleStart);

  const { data: existing } = await (supabase.from('invoices' as any) as any)
    .select('id')
    .eq('user_id', args.user_id)
    .eq('invoice_date', dateStr)
    .maybeSingle();
  if (existing) return;

  await (supabase.from('invoices' as any) as any).insert({
    user_id: args.user_id,
    invoice_date: dateStr,
    due_date: dateStr,
    client_name: args.client_name ?? null,
    client_email: args.client_email ?? null,
    client_phone: args.client_phone ?? null,
    plan: args.plan ?? 'Residential Unlimited',
    amount: args.monthly_fee,
    status: 'UNPAID',
  });
}

export function formatInvoiceDate(d: string | Date | null) {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
