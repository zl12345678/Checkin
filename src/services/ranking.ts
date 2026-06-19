import type { CheckinRecord, Customer, DateRange, RankingEntry } from '@/types/domain';
import { isDateInRange } from '@/utils/dateRange';

export function calculateRanking(
  customers: Customer[],
  checkins: CheckinRecord[],
  range: DateRange,
  pendingRewardCustomerIds = new Set<string>()
): RankingEntry[] {
  const activeCheckins = checkins.filter((record) => {
    return !record.reversedAt && isDateInRange(record.checkedInAt, range);
  });

  const byCustomer = new Map<string, CheckinRecord[]>();
  for (const record of activeCheckins) {
    const records = byCustomer.get(record.customerId) ?? [];
    records.push(record);
    byCustomer.set(record.customerId, records);
  }

  return customers
    .filter((customer) => customer.status === 'active')
    .map((customer) => {
      const records = byCustomer.get(customer.id) ?? [];
      const lastCheckinAt = records
        .map((record) => record.checkedInAt)
        .sort()
        .at(-1);

      return {
        rank: 0,
        customer,
        checkinCount: records.length,
        lastCheckinAt,
        hasPendingReward: pendingRewardCustomerIds.has(customer.id)
      };
    })
    .filter((entry) => entry.checkinCount > 0)
    .sort((left, right) => {
      if (right.checkinCount !== left.checkinCount) {
        return right.checkinCount - left.checkinCount;
      }
      return (left.lastCheckinAt ?? '').localeCompare(right.lastCheckinAt ?? '');
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
}
