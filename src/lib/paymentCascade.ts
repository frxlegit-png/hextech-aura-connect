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

  // 6. Recompute monthly_revenue for this month from live payment_history.
  //    Self-healing: any bill change (paid, reversed, retroactive fix) always
  //    reconciles Section 2, dashboard, and Revenue tab to the true PAID sum.
  //    Manual overrides (logged_by != 'auto') are preserved and NOT overwritten.
  try {
    await recomputeMonthlyRevenue(monthKey);
  } catch {
    // Non-fatal — revenue aggregation shouldn't block the payment itself.
  }
}

/**
 * Recompute a month's row in `monthly_revenue` from the live PAID sum in
 * `payment_history`. Skips manual overrides (logged_by != 'auto'). Idempotent.
 */
export async function recomputeMonthlyRevenue(monthKey: string): Promise<void> {
  const [y, m] = monthKey.split('-').map(Number);
  const startStr = `${monthKey}-01`;
  const endStr = formatDateKey(new Date(y, m, 1));

  const { data: pays } = await (supabase.from('payment_history' as any) as any)
    .select('amount, status')
    .gte('date', startStr)
    .lt('date', endStr);
  const sum = ((pays as any[]) ?? [])
    .filter((p) => (p.status || '').toUpperCase() === 'PAID')
    .reduce((s, p) => s + Number(p.amount ?? 0), 0);

  const { data: existingRev } = await (supabase.from('monthly_revenue' as any) as any)
    .select('id, logged_by')
    .eq('month', monthKey)
    .limit(1);
  const rev = existingRev?.[0];
  const nowIso = new Date().toISOString();

  if (rev) {
    // Preserve manual overrides — do not overwrite user-entered amounts.
    if ((rev.logged_by ?? 'auto') !== 'auto') return;
    await (supabase.from('monthly_revenue' as any) as any)
      .update({ amount: sum, updated_at: nowIso })
      .eq('id', rev.id);
  } else {
    await (supabase.from('monthly_revenue' as any) as any).insert({
      month: monthKey,
      amount: sum,
      logged_by: 'auto',
      updated_at: nowIso,
    });
  }
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

/**
 * Reverse a paid month for a customer. Undoes what `applyMonthlyPayment` did:
 *  - deletes matching payment_history entries for that month
 *  - flips the invoice back to UNPAID (clears paid_date)
 *  - adds monthly_fee back to the outstanding balance
 *  - subtracts monthly_fee from monthly_revenue (floored at 0)
 *  - recomputes last_paid_date from the newest remaining PAID payment
 *  - recomputes account_state
 */
export async function reverseMonthlyPayment(opts: {
  client: CascadeClient;
  monthKey: string;
}): Promise<void> {
  const { client, monthKey } = opts;
  const [y, m] = monthKey.split('-').map(Number);
  const monthStart = `${monthKey}-01`;
  const nextMonth = new Date(y, m, 1);
  const nextStart = formatDateKey(nextMonth);

  // 1. Delete payment_history rows for this user in this month.
  await (supabase.from('payment_history' as any) as any)
    .delete()
    .eq('user_id', client.user_id)
    .eq('status', 'PAID')
    .gte('date', monthStart)
    .lt('date', nextStart);

  // 2. Flip invoice back to UNPAID (keep the row so it stays on the ledger).
  const { data: invList } = await (supabase.from('invoices' as any) as any)
    .select('id')
    .eq('user_id', client.user_id)
    .eq('month_key', monthKey)
    .limit(1);
  const inv = invList?.[0];
  if (inv) {
    await (supabase.from('invoices' as any) as any)
      .update({ status: 'UNPAID', paid_date: null })
      .eq('id', inv.id);
  }

  // 3. Add balance back.
  const newBalance = Number(client.balance ?? 0) + Number(client.monthly_fee ?? 0);

  // 4. Recompute last_paid_date from remaining PAID payments.
  const { data: remaining } = await (supabase.from('payment_history' as any) as any)
    .select('date')
    .eq('user_id', client.user_id)
    .eq('status', 'PAID')
    .order('date', { ascending: false })
    .limit(1);
  const newAnchor: string | null = remaining?.[0]?.date ?? null;

  const patch: Record<string, unknown> = {
    balance: newBalance,
    last_paid_date: newAnchor,
  };

  // 5. Recompute account_state.
  if (!isManual(client.account_state)) {
    if (newBalance > 0.005) {
      patch.account_state = 'expired';
    } else {
      patch.account_state = autoStateFromDay(client.billing_day, newAnchor);
    }
  }

  await (supabase.from('customer_billing' as any) as any)
    .update(patch)
    .eq('user_id', client.user_id);

  // 6. Recompute monthly_revenue for this month from live payment_history.
  //    Preserves manual overrides. Guarantees Section 2, dashboard, and Revenue
  //    tab stay in lock-step with the true PAID sum after a reversal.
  try {
    await recomputeMonthlyRevenue(monthKey);
  } catch {
    // Non-fatal.
  }
}
