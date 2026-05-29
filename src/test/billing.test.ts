import { describe, expect, it } from 'vitest';
import { formatDateKey, getBillingDates, autoStateFromDay } from '@/lib/billing';

describe('payment-anchored billing cycle', () => {
  it('active account, last paid 3 Jun 2026, today 5 Jun 2026', () => {
    const dates = getBillingDates(27, '2026-06-03', new Date(2026, 5, 5));
    expect(formatDateKey(dates.renewalDate!)).toBe('2026-07-27');
    expect(dates.expired).toBe(false);
  });

  it('not yet renewal, last paid 3 May 2026, today 5 Jun 2026', () => {
    const dates = getBillingDates(27, '2026-05-03', new Date(2026, 5, 5));
    expect(formatDateKey(dates.renewalDate!)).toBe('2026-06-27');
    expect(dates.daysRemaining).toBe(22);
    expect(dates.expired).toBe(false);
  });

  it('truly expired, last paid 3 Apr 2026, today 5 Jun 2026', () => {
    const dates = getBillingDates(27, '2026-04-03', new Date(2026, 5, 5));
    expect(formatDateKey(dates.renewalDate!)).toBe('2026-05-27');
    expect(dates.expired).toBe(true);
    expect(autoStateFromDay(27, '2026-04-03')).toBe('expired');
  });

  it('billing_day set, no last_paid_date → ACTIVE with computed renewal', () => {
    const dates = getBillingDates(27, null, new Date(2026, 5, 5));
    // today 5 Jun 2026, anchor = 27 May 2026, renewal = 27 Jun 2026
    expect(formatDateKey(dates.startDate!)).toBe('2026-05-27');
    expect(formatDateKey(dates.renewalDate!)).toBe('2026-06-27');
    expect(dates.expired).toBe(false);
    expect(autoStateFromDay(27, null)).toBe('active');
    expect(autoStateFromDay(null, null)).toBe('active');
  });
});
