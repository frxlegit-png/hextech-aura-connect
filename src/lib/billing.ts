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
 * - No `last_paid_date` -> not started, expired = true.
 * - Renewal Date = `billing_day` of the month AFTER last payment.
 * - Cycle does NOT silently advance when renewal passes; it expires.
 */
export function getBillingDates(
  billingDay: number | null | undefined,
  lastPaidDate: string | Date | null | undefined,
  from: Date = new Date(),
): BillingDates {
  const today = atMidnight(from);
  const day = billingDay && billingDay >= 1 && billingDay <= 28 ? Math.trunc(billingDay) : null;
  const paid = parseDate(lastPaidDate);

/**
 * Calculate billing cycle dates anchored to last_paid_date.
 * - No `last_paid_date` -> treat as ACTIVE (anchor not yet set by admin); no renewal computed.
 * - Renewal Date = `billing_day` of the month AFTER last payment.
 * - Cycle does NOT silently advance when renewal passes; it expires.
 */
export function getBillingDates(
  billingDay: number | null | undefined,
  lastPaidDate: string | Date | null | undefined,
  from: Date = new Date(),
): BillingDates {
  const today = atMidnight(from);
  const day = billingDay && billingDay >= 1 && billingDay <= 28 ? Math.trunc(billingDay) : null;
  const paid = parseDate(lastPaidDate);

  if (!paid) {
    // No payment anchor yet — do NOT auto-expire. Treat as active with no renewal date.
    return { startDate: null, renewalDate: null, daysRemaining: 0, expired: false };
  }
  if (!day) {
    return { startDate: paid, renewalDate: null, daysRemaining: 0, expired: false };
  }

  const renewalDate = atMidnight(new Date(paid.getFullYear(), paid.getMonth() + 1, day));
  const diff = Math.ceil((renewalDate.getTime() - today.getTime()) / MS_DAY);
  const expired = diff <= 0;
  return {
    startDate: paid,
    renewalDate,
    daysRemaining: expired ? 0 : diff,
    expired,
  };
}

  from: Date = new Date(),
): Date | null {
  return getBillingDates(_day, lastPaidDate, from).startDate;
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

/** AUTO state computed from billing_day + last_paid_date. */
export function autoStateFromDay(
  day: number | null | undefined,
  lastPaidDate: string | Date | null | undefined,
): AutoState {
  const { expired, daysRemaining } = getBillingDates(day, lastPaidDate);
  if (expired) return 'expired';
  if (daysRemaining <= 7) return 'expiring';
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
