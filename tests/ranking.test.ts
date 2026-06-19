import { describe, expect, it } from 'vitest';
import type { CheckinRecord, Customer, DateRange } from '@/types/domain';
import { calculateRanking } from '@/services/ranking';

const customers: Customer[] = [
  { id: 'c1', name: '张三', status: 'active', createdAt: '2026-06-01T08:00:00+08:00' },
  { id: 'c2', name: '李四', status: 'active', createdAt: '2026-06-01T08:00:00+08:00' },
  { id: 'c3', name: '王五', status: 'inactive', createdAt: '2026-06-01T08:00:00+08:00' }
];

const range: DateRange = { start: '2026-06-01', end: '2026-06-30' };

describe('ranking', () => {
  it('counts active check-ins in the selected period', () => {
    const checkins: CheckinRecord[] = [
      { id: 'r1', customerId: 'c1', checkedInAt: '2026-06-02T09:00:00+08:00', source: 'voice', isDuplicateSameDay: false },
      { id: 'r2', customerId: 'c1', checkedInAt: '2026-06-03T09:00:00+08:00', source: 'voice', isDuplicateSameDay: false },
      { id: 'r3', customerId: 'c2', checkedInAt: '2026-06-04T09:00:00+08:00', source: 'picker', isDuplicateSameDay: false },
      { id: 'r4', customerId: 'c2', checkedInAt: '2026-07-01T09:00:00+08:00', source: 'picker', isDuplicateSameDay: false },
      { id: 'r5', customerId: 'c2', checkedInAt: '2026-06-05T09:00:00+08:00', source: 'picker', isDuplicateSameDay: false, reversedAt: '2026-06-05T09:10:00+08:00' },
      { id: 'r6', customerId: 'c3', checkedInAt: '2026-06-05T09:00:00+08:00', source: 'picker', isDuplicateSameDay: false }
    ];

    expect(calculateRanking(customers, checkins, range).map((entry) => ({
      rank: entry.rank,
      id: entry.customer.id,
      count: entry.checkinCount
    }))).toEqual([
      { rank: 1, id: 'c1', count: 2 },
      { rank: 2, id: 'c2', count: 1 }
    ]);
  });

  it('orders ties by earlier latest check-in time', () => {
    const checkins: CheckinRecord[] = [
      { id: 'r1', customerId: 'c1', checkedInAt: '2026-06-02T09:00:00+08:00', source: 'voice', isDuplicateSameDay: false },
      { id: 'r2', customerId: 'c2', checkedInAt: '2026-06-03T09:00:00+08:00', source: 'picker', isDuplicateSameDay: false }
    ];

    expect(calculateRanking(customers, checkins, range).map((entry) => entry.customer.id)).toEqual(['c1', 'c2']);
  });

  it('marks pending rewards by customer id', () => {
    const checkins: CheckinRecord[] = [
      { id: 'r1', customerId: 'c1', checkedInAt: '2026-06-02T09:00:00+08:00', source: 'voice', isDuplicateSameDay: false }
    ];

    expect(calculateRanking(customers, checkins, range, new Set(['c1']))[0].hasPendingReward).toBe(true);
  });
});
