// Payment-anchored monthly billing cycle.
// The cycle NEVER auto-renews. Only an admin PAID action advances `last_paid_date`.

export type AutoState = 'active' | 'expiring' | 'expired';
export type ManualState = 'suspended' | 'pending';
export type AnyState = AutoState | ManualState;

export interface BillingDates {
  startDate: Date | null;
  renewalDate: Date | null;
  daysRemaining: number;
  expired: boolean;
}

const MS_DAY = 1000 * 60 * 60 * 24;

function atMidnight(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function formatDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) return atMidnight(input);
  // YYYY-MM-DD safe parse
  const parts = String(input).slice(0, 10).split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    if (y && m && d) return atMidnight(new Date(y, m - 1, d));
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : atMidnight(d);
}

/**
 * Calculate billing cycle dates anchored to last_paid_date.
 * - No `last_paid_date` -> treat as ACTIVE (anchor not yet set by admin); no renewal computed.
 * - Renewal Date = `billing_day` of the month AFTER last payment.
/**
 * Calculate billing cycle dates.
 * - With `last_paid_date`: anchor cycle to that date; renewal = billing_day of next month.
 * - Without `last_paid_date` but billing_day set: anchor to the most recent occurrence of
 *   billing_day on/before today; renewal = the next occurrence of billing_day.
 * - Without billing_day: no dates.
 */
export function getBillingDates(
  billingDay: number | null | undefined,
  lastPaidDate: string | Date | null | undefined,
  from: Date = new Date(),
): BillingDates {
  const today = atMidnight(from);
  const day = billingDay && billingDay >= 1 && billingDay <= 28 ? Math.trunc(billingDay) : null;
  const paid = parseDate(lastPaidDate);

  if (!day) {
    return { startDate: paid, renewalDate: null, daysRemaining: 0, expired: false };
  }

  let startDate: Date;
  if (paid) {
    startDate = paid;
  } else {
    // Anchor to most recent billing_day on/before today.
    const thisMonth = atMidnight(new Date(today.getFullYear(), today.getMonth(), day));
    startDate = today >= thisMonth
      ? thisMonth
      : atMidnight(new Date(today.getFullYear(), today.getMonth() - 1, day));
  }

  const renewalDate = atMidnight(new Date(startDate.getFullYear(), startDate.getMonth() + 1, day));
  const diff = Math.ceil((renewalDate.getTime() - today.getTime()) / MS_DAY);
  const expired = diff <= 0;
  return {
    startDate,
    renewalDate,
    daysRemaining: expired ? 0 : diff,
    expired,
  };
}

/** Most recent invoice/cycle anchor — the last paid date (or null if never paid). */
export function currentCycleStart(
  day: number | null | undefined,
  lastPaidDate: string | Date | null | undefined,
  from: Date = new Date(),
): Date | null {
  return getBillingDates(day, lastPaidDate, from).startDate;
}


export function nextBillingDate(
  day: number | null | undefined,
  lastPaidDate: string | Date | null | undefined,
  from: Date = new Date(),
): Date | null {
  return getBillingDates(day, lastPaidDate, from).renewalDate;
}

export function daysRemaining(
  day: number | null | undefined,
  lastPaidDate: string | Date | null | undefined,
  from: Date = new Date(),
): number {
  return getBillingDates(day, lastPaidDate, from).daysRemaining;
}

/** AUTO state from billing_day + last_paid_date.
 *  - No billing_day => ACTIVE (not configured).
 *  - No last_paid_date => ACTIVE (no payment anchor yet; never auto-expire). */
export function autoStateFromDay(
  day: number | null | undefined,
  lastPaidDate: string | Date | null | undefined,
): AutoState {
  if (!day) return 'active';
  if (!lastPaidDate) return 'active';
  const { expired, daysRemaining } = getBillingDates(day, lastPaidDate);
  if (expired) return 'expired';
  if (daysRemaining > 0 && daysRemaining <= 7) return 'expiring';
  return 'active';
}




export const MANUAL_STATES: ManualState[] = ['suspended', 'pending'];

export function isManual(state: string | null | undefined): state is ManualState {
  return state === 'suspended' || state === 'pending';
}

/** Effective state: manual override > auto from payment anchor. */
export function effectiveState(
  billing_day: number | null | undefined,
  lastPaidDate: string | Date | null | undefined,
  stored_state: string | null | undefined,
): AnyState {
  if (isManual(stored_state)) return stored_state;
  return autoStateFromDay(billing_day, lastPaidDate);
}

export function formatDate(d: Date | null) {
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

import { supabase } from '@/integrations/supabase/client';

/**
 * When the LIVE effective state is `expired`, persist the correct state and
 * balance on the customer's billing row so admin views (billing tab, customer
 * profile, reports) reflect reality even before the client logs in.
 *
 *  - Writes `account_state = 'expired'` when live state is expired and stored
 *    state is anything other than `suspended` / `pending` / `expired`.
 *  - Writes `balance = monthly_fee` when live state is expired and the stored
 *    balance doesn't already match the monthly fee.
 *  - Skips manual overrides (suspended / pending) entirely.
 *
 * Returns true when any DB update was written.
 */
export async function syncExpiredBalance(row: {
  user_id: string;
  billing_day: number | null | undefined;
  last_paid_date: string | null | undefined;
  account_state: string | null | undefined;
  balance: number | null | undefined;
  monthly_fee: number | null | undefined;
}): Promise<boolean> {
  if (isManual(row.account_state)) return false;
  const auto = autoStateFromDay(row.billing_day, row.last_paid_date);
  if (auto !== 'expired') return false;

  const fee = Number(row.monthly_fee ?? 0);
  const current = Number(row.balance ?? 0);
  const patch: Record<string, unknown> = {};

  if ((row.account_state ?? '').toLowerCase() !== 'expired') {
    patch.account_state = 'expired';
  }
  if (fee > 0 && Math.abs(current - fee) >= 0.005) {
    patch.balance = fee;
  }
  if (Object.keys(patch).length === 0) return false;

  const { error } = await (supabase.from('customer_billing' as any) as any)
    .update(patch)
    .eq('user_id', row.user_id);
  return !error;
}

