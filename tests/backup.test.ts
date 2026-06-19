import { describe, expect, it } from 'vitest';
import { createBackupSnapshot } from '@/services/backup';
import type { AppDataState } from '@/services/appData';

describe('backup snapshot', () => {
  it('exports all local data with an export timestamp', () => {
    const state: AppDataState = {
      customers: [{ id: 'c1', name: '张三', status: 'active', createdAt: '2026-06-01T08:00:00+08:00' }],
      checkins: [{ id: 'r1', customerId: 'c1', checkedInAt: '2026-06-19T09:00:00+08:00', source: 'voice', isDuplicateSameDay: false }],
      rewardRules: [],
      rewardClaims: [],
      lastBackupAt: '2026-06-18T09:00:00+08:00'
    };

    expect(createBackupSnapshot(state, '2026-06-19T10:00:00+08:00')).toEqual({
      exportedAt: '2026-06-19T10:00:00+08:00',
      version: 1,
      customers: state.customers,
      checkins: state.checkins,
      rewardRules: [],
      rewardClaims: []
    });
  });
});
