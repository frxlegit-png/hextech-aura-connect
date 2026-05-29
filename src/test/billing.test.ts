import { describe, expect, it } from 'vitest';
import { formatDateKey, getBillingDates, autoStateFromDay } from '@/lib/billing';

describe('payment-anchored billing cycle', () => {
  it('Case 1 — active account, last paid 3 Jun 2026, today 5 Jun 2026', () => {
    const dates = getBillingDates(27, '2026-06-03', new Date(2026, 5, 5));
    expect(formatDateKey(dates.renewalDate!)).toBe('2026-07-27');
    expect(dates.daysRemaining).toBe(52);
    expect(dates.expired).toBe(false);
    expect(autoStateFromDay(27, '2026-06-03') === 'expired').toBe(false);
  });

  it('Case 2 — expired, last paid 3 May 2026, today 5 Jun 2026 (cycle does not reset)', () => {
    const dates = getBillingDates(27, '2026-05-03', new Date(2026, 5, 5));
    expect(formatDateKey(dates.renewalDate!)).toBe('2026-06-27');
    // 22 days remaining from June 5
    expect(dates.daysRemaining).toBe(22);
    expect(dates.expired).toBe(false);
  });

  it('Case 2b — truly expired, last paid 3 Apr 2026, today 5 Jun 2026', () => {
    const dates = getBillingDates(27, '2026-04-03', new Date(2026, 5, 5));
    expect(formatDateKey(dates.renewalDate!)).toBe('2026-05-27');
    expect(dates.daysRemaining).toBe(0);
    expect(dates.expired).toBe(true);
    expect(autoStateFromDay(27, '2026-04-03')).toBe('expired');
  });

  it('Case 3 — admin clicks PAID on 5 Jun 2026, anchor advances to today', () => {
    const dates = getBillingDates(27, '2026-06-05', new Date(2026, 5, 5));
    expect(formatDateKey(dates.renewalDate!)).toBe('2026-07-27');
    expect(dates.expired).toBe(false);
  });

  it('no last_paid_date → expired, no renewal computed', () => {
    const dates = getBillingDates(27, null, new Date(2026, 5, 5));
    expect(dates.renewalDate).toBeNull();
    expect(dates.expired).toBe(true);
    expect(dates.daysRemaining).toBe(0);
  });
});
