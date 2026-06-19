import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { Customer, RankingEntry, RewardClaim, RewardRule } from '@/types/domain';
import { createMemoryDb } from '@/repositories/db';
import { createRewardRepository } from '@/repositories/rewardRepository';
import { calculateRewardEligibility } from '@/services/rewards';
import { useRewardStore } from '@/stores/rewardStore';

const customer: Customer = { id: 'c1', name: '张三', status: 'active', createdAt: '2026-06-01T08:00:00+08:00' };
const ranking: RankingEntry[] = [
  { rank: 1, customer, checkinCount: 6, lastCheckinAt: '2026-06-19T09:00:00+08:00', hasPendingReward: false }
];
const rules: RewardRule[] = [
  { id: 'rule1', kind: 'count', name: '中礼品', threshold: 6, period: { start: '2026-06-01', end: '2026-06-30' }, active: true },
  { id: 'rule2', kind: 'ranking', name: '一等奖', rankStart: 1, rankEnd: 1, period: { start: '2026-06-01', end: '2026-06-30' }, active: true }
];

describe('reward eligibility', () => {
  it('creates pending count and ranking rewards', () => {
    expect(calculateRewardEligibility([customer], ranking, rules, [])).toEqual([
      { rule: rules[0], customer, status: 'pending' },
      { rule: rules[1], customer, status: 'pending' }
    ]);
  });

  it('uses claimed status when a claim exists', () => {
    const claims: RewardClaim[] = [
      { id: 'claim1', ruleId: 'rule1', customerId: 'c1', status: 'claimed', claimedAt: '2026-06-20T09:00:00+08:00', updatedAt: '2026-06-20T09:00:00+08:00' }
    ];

    expect(calculateRewardEligibility([customer], ranking, rules, claims)[0].status).toBe('claimed');
  });
});

describe('reward store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('saves rules, refreshes eligibility, and marks claims', async () => {
    const db = createMemoryDb();
    const repository = createRewardRepository(db);
    const store = useRewardStore();
    store.bindRepository(repository);

    await store.addRule({
      kind: 'count',
      name: '小礼品',
      threshold: 3,
      period: { start: '2026-06-01', end: '2026-06-30' },
      active: true
    });
    await store.refreshEligibility([customer], ranking);

    expect(store.eligibility).toHaveLength(1);
    expect(store.eligibility[0].status).toBe('pending');

    await store.markClaimed('rule1', 'c1', '2026-06-20T09:00:00+08:00');
    await store.refreshEligibility([customer], ranking);

    expect(store.eligibility[0].status).toBe('claimed');

    await store.revertClaim('rule1', 'c1', '2026-06-20T09:10:00+08:00');
    await store.refreshEligibility([customer], ranking);

    expect(store.eligibility[0].status).toBe('pending');
  });
});
