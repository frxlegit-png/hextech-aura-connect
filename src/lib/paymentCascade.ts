import { supabase } from '@/integrations/supabase/client';
import { formatDateKey, autoStateFromDay, isManual } from '@/lib/billing';

export interface CascadeClient {
  user_id: string;
  full_name: string | null;
  email?: string | null;
  phone?: string | null;
  monthly_fee: number;
  balance: number;
  billing_day: number | null;
  account_state: string;
  last_paid_date: string | null;
}

const MONTH_FULL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/** YYYY-MM for the target month. */
export function monthKeyOf(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

/** Full "Month YYYY" label. */
export function monthLabel(year: number, monthIndex: number): string {
  return `${MONTH_FULL[monthIndex]} ${year}`;
}

/**
 * Apply a paid month to a customer. Handles: payment_history log,
 * invoice upsert (flip existing UNPAID → PAID, or insert new PAID),
 * outstanding balance decrement, last_paid_date advance, and account_state
 * recompute.
 *
 * `monthKey` — YYYY-MM of the month being paid.
 * `method`   — payment method label (Cash, EcoCash, Bank Transfer, Omari).
 */
export async function applyMonthlyPayment(opts: {
  client: CascadeClient;
  monthKey: string;
  method: string;
}): Promise<void> {
  const { client, monthKey, method } = opts;
  if (!client.billing_day) throw new Error('Set a billing day on this account first.');

  const [y, m] = monthKey.split('-').map(Number);
  const day = Math.min(client.billing_day, 28);
  const paidDate = new Date(y, m - 1, day);
  const paidStr = formatDateKey(paidDate);
  const todayStr = formatDateKey(new Date());
  const label = monthLabel(y, m - 1);

  // 1. Log payment_history (dated to the billing day of the month being paid).
  await (supabase.from('payment_history' as any) as any).insert({
    user_id: client.user_id,
    date: paidStr,
    description: `Monthly Subscription — ${label}`,
    method,
    amount: client.monthly_fee,
    status: 'PAID',
  });

  // 2. Upsert invoice for that month.
  const { data: existingList } = await (supabase.from('invoices' as any) as any)
    .select('id')
    .eq('user_id', client.user_id)
    .eq('month_key', monthKey)
    .limit(1);
  const existing = existingList?.[0];

  if (existing) {
    await (supabase.from('invoices' as any) as any)
      .update({ status: 'PAID', paid_date: todayStr })
      .eq('id', existing.id);
  } else {
    await (supabase.from('invoices' as any) as any).insert({
      user_id: client.user_id,
      invoice_date: paidStr,
      due_date: paidStr,
      month_key: monthKey,
      client_name: client.full_name,
      client_email: client.email ?? null,
      client_phone: client.phone ?? null,
      plan: 'Residential Unlimited',
      amount: client.monthly_fee,
      status: 'PAID',
      paid_date: todayStr,
    });
  }

  // 3. Decrement outstanding balance.
  const newBalance = Math.max(0, Number(client.balance ?? 0) - Number(client.monthly_fee ?? 0));

  // 4. Advance last_paid_date only if newer.
  const patch: Record<string, unknown> = { balance: newBalance };
  const currentAnchor = client.last_paid_date ? new Date(client.last_paid_date) : null;
  if (!currentAnchor || paidDate > currentAnchor) {
    patch.last_paid_date = paidStr;
  }

  // 5. Recompute account_state.
  if (!isManual(client.account_state)) {
    const anchorForState = patch.last_paid_date ?? client.last_paid_date;
    if (newBalance <= 0.005) {
      patch.account_state = autoStateFromDay(client.billing_day, anchorForState as string | null);
    } else {
      patch.account_state = 'expired';
    }
  }

  await (supabase.from('customer_billing' as any) as any)
    .update(patch)
    .eq('user_id', client.user_id);
}

/**
 * Auto-generate an UNPAID invoice for the current month once the billing day
 * has arrived, if none exists yet. Idempotent via `month_key`.
 * Also enforces the "keep only 5 most recent invoices" rule.
 */
export async function ensureBillingDayInvoice(client: {
  user_id: string;
  full_name: string | null;
  email?: string | null;
  phone?: string | null;
  billing_day: number | null;
  monthly_fee: number;
}): Promise<void> {
  if (!client.billing_day) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = Math.min(client.billing_day, 28);
  const invoiceDate = new Date(today.getFullYear(), today.getMonth(), day);
  if (today < invoiceDate) return;

  const monthKey = monthKeyOf(today.getFullYear(), today.getMonth());
  const invStr = formatDateKey(invoiceDate);

  const { data: existing } = await (supabase.from('invoices' as any) as any)
    .select('id')
    .eq('user_id', client.user_id)
    .eq('month_key', monthKey)
    .limit(1);
  if (existing && existing.length > 0) return;

  await (supabase.from('invoices' as any) as any).insert({
    user_id: client.user_id,
    invoice_date: invStr,
    due_date: invStr,
    month_key: monthKey,
    client_name: client.full_name,
    client_email: client.email ?? null,
    client_phone: client.phone ?? null,
    plan: 'Residential Unlimited',
    amount: client.monthly_fee,
    status: 'UNPAID',
  });

  // Trim to 5 most recent invoices per client.
  const { data: all } = await (supabase.from('invoices' as any) as any)
    .select('id, invoice_date, created_at')
    .eq('user_id', client.user_id)
    .order('invoice_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (all && all.length > 5) {
    const toDelete = all.slice(5).map((r: any) => r.id);
    if (toDelete.length) {
      await (supabase.from('invoices' as any) as any).delete().in('id', toDelete);
    }
  }
}

/**
 * How many whole months a client is overdue, based on last_paid_date and
 * their billing day. 0 = current. Only counts months where the billing day
 * has already passed.
 */
export function monthsOverdue(
  billing_day: number | null,
  last_paid_date: string | null,
  now: Date = new Date(),
): number {
  if (!billing_day) return 0;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = Math.min(billing_day, 28);

  let anchor: Date;
  if (last_paid_date) {
    const [y, m, d] = last_paid_date.slice(0, 10).split('-').map(Number);
    anchor = new Date(y, m - 1, d);
  } else {
    // No payment yet — anchor to the most recent billing day on/before today.
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), day);
    anchor = today >= thisMonth
      ? thisMonth
      : new Date(today.getFullYear(), today.getMonth() - 1, day);
    // Treat as one cycle overdue baseline
  }

  // Next unpaid billing date after anchor:
  const next = new Date(anchor.getFullYear(), anchor.getMonth() + 1, day);
  if (today < next) return 0;

  let count = 0;
  const cursor = new Date(next);
  while (cursor <= today) {
    count += 1;
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return count;
}
