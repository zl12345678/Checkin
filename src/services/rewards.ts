import type { Customer, RankingEntry, RewardClaim, RewardEligibility, RewardRule } from '@/types/domain';

export function calculateRewardEligibility(
  customers: Customer[],
  ranking: RankingEntry[],
  rules: RewardRule[],
  claims: RewardClaim[]
): RewardEligibility[] {
  const activeRules = rules.filter((rule) => rule.active);
  const rankingByCustomer = new Map(ranking.map((entry) => [entry.customer.id, entry]));
  const claimsByRuleAndCustomer = new Map(claims.map((claim) => [`${claim.ruleId}:${claim.customerId}`, claim]));
  const results: RewardEligibility[] = [];

  for (const customer of customers.filter((item) => item.status === 'active')) {
    const entry = rankingByCustomer.get(customer.id);
    if (!entry) {
      continue;
    }

    for (const rule of activeRules) {
      const isCountReward = rule.kind === 'count' && typeof rule.threshold === 'number' && entry.checkinCount >= rule.threshold;
      const isRankingReward =
        rule.kind === 'ranking' &&
        typeof rule.rankStart === 'number' &&
        typeof rule.rankEnd === 'number' &&
        entry.rank >= rule.rankStart &&
        entry.rank <= rule.rankEnd;

      if (!isCountReward && !isRankingReward) {
        continue;
      }

      const claim = claimsByRuleAndCustomer.get(`${rule.id}:${customer.id}`);
      results.push({
        rule,
        customer,
        status: claim?.status ?? 'pending',
        claim
      });
    }
  }

  return results;
}
