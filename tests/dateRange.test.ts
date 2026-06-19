import { describe, expect, it } from 'vitest';
import { getMonthRange, getPreviousMonthRange, isDateInRange } from '@/utils/dateRange';

describe('date ranges', () => {
  it('returns the current month range in local date format', () => {
    expect(getMonthRange(new Date('2026-06-19T10:00:00+08:00'))).toEqual({
      start: '2026-06-01',
      end: '2026-06-30'
    });
  });

  it('returns the previous month range across year boundaries', () => {
    expect(getPreviousMonthRange(new Date('2026-01-05T10:00:00+08:00'))).toEqual({
      start: '2025-12-01',
      end: '2025-12-31'
    });
  });

  it('checks whether an ISO date-time is inside a date range', () => {
    const range = { start: '2026-06-01', end: '2026-06-30' };

    expect(isDateInRange('2026-06-01T00:00:00+08:00', range)).toBe(true);
    expect(isDateInRange('2026-06-30T23:59:00+08:00', range)).toBe(true);
    expect(isDateInRange('2026-07-01T00:00:00+08:00', range)).toBe(false);
  });
});
