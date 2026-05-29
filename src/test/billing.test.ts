import { describe, expect, it } from 'vitest';
import { formatDateKey, getBillingDates } from '@/lib/billing';

describe('billing cycle dates', () => {
  it('keeps billing day 27 aligned from May 29 2026', () => {
    const dates = getBillingDates(27, new Date(2026, 4, 29));

    expect(dates && formatDateKey(dates.startDate)).toBe('2026-05-27');
    expect(dates && formatDateKey(dates.renewalDate)).toBe('2026-06-27');
    expect(dates?.daysRemaining).toBe(29);
  });

  it('uses the previous month when today is before the billing day', () => {
    const dates = getBillingDates(10, new Date(2026, 5, 5));

    expect(dates && formatDateKey(dates.startDate)).toBe('2026-05-10');
    expect(dates && formatDateKey(dates.renewalDate)).toBe('2026-06-10');
    expect(dates?.daysRemaining).toBe(5);
  });
});