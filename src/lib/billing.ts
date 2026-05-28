// Auto-renewing monthly billing cycle based on a day-of-month (1–28).

export type AutoState = 'active' | 'expiring' | 'expired';
export type ManualState = 'suspended' | 'pending';
export type AnyState = AutoState | ManualState;

const MS_DAY = 1000 * 60 * 60 * 24;

function atMidnight(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Returns the next occurrence (>= today) of `day` in the current or next month. */
export function nextBillingDate(day: number, from = new Date()): Date {
  const today = atMidnight(from);
  const candidate = new Date(today.getFullYear(), today.getMonth(), day);
  if (candidate.getTime() < today.getTime()) {
    return new Date(today.getFullYear(), today.getMonth() + 1, day);
  }
  return candidate;
}

/** Returns the most recent occurrence (<= today) of `day`. */
export function currentCycleStart(day: number, from = new Date()): Date {
  const today = atMidnight(from);
  const candidate = new Date(today.getFullYear(), today.getMonth(), day);
  if (candidate.getTime() > today.getTime()) {
    return new Date(today.getFullYear(), today.getMonth() - 1, day);
  }
  return candidate;
}

export function daysRemaining(day: number | null | undefined, from = new Date()): number | null {
  if (!day) return null;
  const next = nextBillingDate(day, from);
  return Math.max(0, Math.ceil((next.getTime() - atMidnight(from).getTime()) / MS_DAY));
}

/** Compute the AUTO state from billing_day. */
export function autoStateFromDay(day: number | null | undefined): AutoState {
  const d = daysRemaining(day);
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

export function formatDate(d: Date | null) {
  if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
