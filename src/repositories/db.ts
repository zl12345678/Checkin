import type { CheckinRecord, Customer, RewardClaim, RewardRule } from '@/types/domain';

export interface MemoryDbState {
  customers: Customer[];
  checkins: CheckinRecord[];
  rewardRules: RewardRule[];
  rewardClaims: RewardClaim[];
}

export interface MemoryDb {
  state: MemoryDbState;
  nextId(prefix: string): string;
}

export function createMemoryDb(seed: Partial<MemoryDbState> = {}): MemoryDb {
  const counters = new Map<string, number>();
  const state: MemoryDbState = {
    customers: seed.customers ? [...seed.customers] : [],
    checkins: seed.checkins ? [...seed.checkins] : [],
    rewardRules: seed.rewardRules ? [...seed.rewardRules] : [],
    rewardClaims: seed.rewardClaims ? [...seed.rewardClaims] : []
  };

  return {
    state,
    nextId(prefix: string): string {
      const next = (counters.get(prefix) ?? 0) + 1;
      counters.set(prefix, next);
      return `${prefix}${next}`;
    }
  };
}
