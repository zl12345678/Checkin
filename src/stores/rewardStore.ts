import { defineStore } from 'pinia';
import type { Customer, RankingEntry, RewardEligibility, RewardRule } from '@/types/domain';
import type { RewardRepository } from '@/repositories/rewardRepository';
import { calculateRewardEligibility } from '@/services/rewards';

let rewardRepository: RewardRepository | undefined;

function requireRewardRepository(): RewardRepository {
  if (!rewardRepository) {
    throw new Error('Reward repository is not bound');
  }
  return rewardRepository;
}

export const useRewardStore = defineStore('rewards', {
  state: () => ({
    eligibility: [] as RewardEligibility[]
  }),
  actions: {
    bindRepository(repository: RewardRepository) {
      rewardRepository = repository;
    },
    async addRule(rule: Omit<RewardRule, 'id'>) {
      await requireRewardRepository().saveRule(rule);
    },
    async refreshEligibility(customers: Customer[], ranking: RankingEntry[]) {
      const repository = requireRewardRepository();
      this.eligibility = calculateRewardEligibility(
        customers,
        ranking,
        await repository.listRules(),
        await repository.listClaims()
      );
    },
    async markClaimed(ruleId: string, customerId: string, claimedAt: string) {
      await requireRewardRepository().markClaimed(ruleId, customerId, claimedAt);
    },
    async revertClaim(ruleId: string, customerId: string, updatedAt: string) {
      await requireRewardRepository().revertClaim(ruleId, customerId, updatedAt);
    }
  }
});
