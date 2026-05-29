// Auto-renewing monthly billing cycle based on a day-of-month (1–28).

export type AutoState = 'active' | 'expiring' | 'expired';
export type ManualState = 'suspended' | 'pending';
export type AnyState = AutoState | ManualState;
export interface BillingDates {
  startDate: Date;
  renewalDate: Date;
  daysRemaining: number;
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

/** Single source of truth for the current monthly billing cycle. */
export function getBillingDates(billingDay: number | null | undefined, from = new Date()): BillingDates | null {
  if (!billingDay || billingDay < 1 || billingDay > 28) return null;

  const day = Math.trunc(billingDay);
  const today = atMidnight(from);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let startDate = new Date(currentYear, currentMonth, day);
  if (today.getDate() < day) {
    startDate = new Date(currentYear, currentMonth - 1, day);
  }
  startDate = atMidnight(startDate);

  const renewalDate = atMidnight(new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()));
  const daysRemaining = Math.max(0, Math.ceil((renewalDate.getTime() - today.getTime()) / MS_DAY));

  return { startDate, renewalDate, daysRemaining };
}

/** Returns the renewal date for the current cycle. */
export function nextBillingDate(day: number, from = new Date()): Date {
  return getBillingDates(day, from)?.renewalDate ?? atMidnight(from);
}

/** Returns the most recent occurrence (<= today) of `day`. */
export function currentCycleStart(day: number, from = new Date()): Date {
  return getBillingDates(day, from)?.startDate ?? atMidnight(from);
}

export function daysRemaining(day: number | null | undefined, from = new Date()): number | null {
  return getBillingDates(day, from)?.daysRemaining ?? null;
}

/** Days remaining preferring an explicit paid_until date (set on payment confirmation). */
export function daysRemainingWithPaid(
  paid_until: string | null | undefined,
  day: number | null | undefined,
  from = new Date(),
): number | null {
  if (day) return daysRemaining(day, from);
  if (paid_until) {
    const end = atMidnight(new Date(paid_until));
    return Math.max(0, Math.ceil((end.getTime() - atMidnight(from).getTime()) / MS_DAY));
  }
  return daysRemaining(day, from);
}

/** Compute the AUTO state from billing_day. */
export function autoStateFromDay(day: number | null | undefined): AutoState {
  const d = daysRemaining(day);
  if (d === null) return 'active';
  if (d <= 0) return 'expired';
  if (d <= 7) return 'expiring';
  return 'active';
}

function autoStateFromDays(d: number | null): AutoState {
  if (d === null) return 'active';
  if (d <= 0) return 'expired';
  if (d <= 7) return 'expiring';
  return 'active';
}

export const MANUAL_STATES: ManualState[] = ['suspended', 'pending'];

export function isManual(state: string | null | undefined): state is ManualState {
  return state === 'suspended' || state === 'pending';
}

/** The effective state shown to the user. Manual overrides win. */
export function effectiveState(
  billing_day: number | null | undefined,
  stored_state: string | null | undefined,
): AnyState {
  if (isManual(stored_state)) return stored_state;
  return autoStateFromDay(billing_day);
}

/** Effective state preferring paid_until when present. */
export function effectiveStateWithPaid(
  paid_until: string | null | undefined,
  billing_day: number | null | undefined,
  stored_state: string | null | undefined,
): AnyState {
  if (isManual(stored_state)) return stored_state;
  if (billing_day) return autoStateFromDay(billing_day);
  return autoStateFromDays(daysRemainingWithPaid(paid_until, billing_day));
}

/** Effective renewal date from billing_day; paid_until is only a legacy fallback. */
export function effectiveRenewalDate(
  paid_until: string | null | undefined,
  billing_day: number | null | undefined,
): Date | null {
  if (billing_day) return getBillingDates(billing_day)?.renewalDate ?? null;
  if (paid_until) return atMidnight(new Date(paid_until));
  return null;
}


export function formatDate(d: Date | null) {
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
