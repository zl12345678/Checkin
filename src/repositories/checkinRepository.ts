import type { CheckinRecord } from '@/types/domain';
import type { MemoryDb } from './db';

export interface CreateCheckinInput {
  customerId: string;
  checkedInAt: string;
  source: CheckinRecord['source'];
  isDuplicateSameDay: boolean;
}

export function createCheckinRepository(db: MemoryDb) {
  return {
    async list(): Promise<CheckinRecord[]> {
      return [...db.state.checkins];
    },
    async listRecent(limit = 5): Promise<CheckinRecord[]> {
      return [...db.state.checkins]
        .filter((record) => !record.reversedAt)
        .sort((left, right) => right.checkedInAt.localeCompare(left.checkedInAt))
        .slice(0, limit);
    },
    async hasCheckinOnDay(customerId: string, day: string): Promise<boolean> {
      return db.state.checkins.some((record) => {
        return record.customerId === customerId && !record.reversedAt && record.checkedInAt.slice(0, 10) === day;
      });
    },
    async create(input: CreateCheckinInput): Promise<CheckinRecord> {
      const record: CheckinRecord = {
        id: db.nextId('r'),
        ...input
      };
      db.state.checkins.push(record);
      return record;
    },
    async reverse(recordId: string, reversedAt: string): Promise<void> {
      const record = db.state.checkins.find((item) => item.id === recordId);
      if (record) {
        record.reversedAt = reversedAt;
      }
    }
  };
}

export type CheckinRepository = ReturnType<typeof createCheckinRepository>;
