import type { AppDataState } from '@/services/appData';
import type { CheckinRecord, Customer, RewardClaim, RewardRule } from '@/types/domain';

export interface BackupSnapshot {
  version: 1;
  exportedAt: string;
  customers: Customer[];
  checkins: CheckinRecord[];
  rewardRules: RewardRule[];
  rewardClaims: RewardClaim[];
}

export function createBackupSnapshot(state: AppDataState, exportedAt: string): BackupSnapshot {
  return {
    version: 1,
    exportedAt,
    customers: [...state.customers],
    checkins: [...state.checkins],
    rewardRules: [...state.rewardRules],
    rewardClaims: [...state.rewardClaims]
  };
}
