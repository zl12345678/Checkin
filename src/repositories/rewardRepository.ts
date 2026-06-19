import type { RewardClaim, RewardRule } from '@/types/domain';
import type { MemoryDb } from './db';

export function createRewardRepository(db: MemoryDb) {
  return {
    async listRules(): Promise<RewardRule[]> {
      return [...db.state.rewardRules];
    },
    async saveRule(rule: Omit<RewardRule, 'id'>): Promise<RewardRule> {
      const saved: RewardRule = { id: db.nextId('rule'), ...rule };
      db.state.rewardRules.push(saved);
      return saved;
    },
    async listClaims(): Promise<RewardClaim[]> {
      return [...db.state.rewardClaims];
    },
    async markClaimed(ruleId: string, customerId: string, claimedAt: string): Promise<RewardClaim> {
      const existing = db.state.rewardClaims.find((claim) => claim.ruleId === ruleId && claim.customerId === customerId);
      if (existing) {
        existing.status = 'claimed';
        existing.claimedAt = claimedAt;
        existing.updatedAt = claimedAt;
        return existing;
      }

      const claim: RewardClaim = {
        id: db.nextId('claim'),
        ruleId,
        customerId,
        status: 'claimed',
        claimedAt,
        updatedAt: claimedAt
      };
      db.state.rewardClaims.push(claim);
      return claim;
    },
    async revertClaim(ruleId: string, customerId: string, updatedAt: string): Promise<void> {
      const existing = db.state.rewardClaims.find((claim) => claim.ruleId === ruleId && claim.customerId === customerId);
      if (existing) {
        existing.status = 'pending';
        existing.claimedAt = undefined;
        existing.updatedAt = updatedAt;
      }
    }
  };
}

export type RewardRepository = ReturnType<typeof createRewardRepository>;
