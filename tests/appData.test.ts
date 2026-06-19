import { describe, expect, it } from 'vitest';
import {
  addCustomer,
  createAppDataStore,
  createCheckin,
  createEmptyAppDataState,
  createMemoryStorageAdapter,
  deactivateCustomer,
  deactivateRewardRule,
  getTodayCheckins
} from '@/services/appData';

describe('app data store', () => {
  it('creates customers and check-ins in the same local state', () => {
    const store = createAppDataStore(createMemoryStorageAdapter());
    const customer = addCustomer(store, { name: '张三', phoneLast4: '1234', note: '老顾客' }, '2026-06-19T09:00:00+08:00');

    createCheckin(store, customer.id, 'picker', '2026-06-19T10:00:00+08:00');

    const state = store.load();
    expect(state.customers).toHaveLength(1);
    expect(state.checkins).toHaveLength(1);
    expect(state.customers[0].lastCheckinAt).toBe('2026-06-19T10:00:00+08:00');
  });

  it('marks same-day duplicate check-ins', () => {
    const store = createAppDataStore(createMemoryStorageAdapter());
    const customer = addCustomer(store, { name: '张三' }, '2026-06-19T09:00:00+08:00');

    createCheckin(store, customer.id, 'voice', '2026-06-19T10:00:00+08:00');
    const duplicate = createCheckin(store, customer.id, 'voice', '2026-06-19T11:00:00+08:00');

    expect(duplicate.isDuplicateSameDay).toBe(true);
    expect(getTodayCheckins(store.load(), '2026-06-19')).toHaveLength(2);
  });

  it('deactivates customers without removing their history', () => {
    const store = createAppDataStore(createMemoryStorageAdapter());
    const customer = addCustomer(store, { name: '张三' }, '2026-06-19T09:00:00+08:00');
    createCheckin(store, customer.id, 'picker', '2026-06-19T10:00:00+08:00');

    deactivateCustomer(store, customer.id);

    const state = store.load();
    expect(state.customers[0].status).toBe('inactive');
    expect(state.checkins).toHaveLength(1);
  });

  it('deactivates reward rules without removing claims', () => {
    const store = createAppDataStore(createMemoryStorageAdapter());
    const state = store.load();
    state.rewardRules.push({
      id: 'rule1',
      kind: 'count',
      name: '小礼品',
      threshold: 3,
      period: { start: '2026-06-01', end: '2026-06-30' },
      active: true
    });
    state.rewardClaims.push({
      id: 'claim1',
      ruleId: 'rule1',
      customerId: 'c1',
      status: 'claimed',
      updatedAt: '2026-06-19T10:00:00+08:00'
    });
    store.save(state);

    deactivateRewardRule(store, 'rule1');

    expect(store.load().rewardRules[0].active).toBe(false);
    expect(store.load().rewardClaims).toHaveLength(1);
  });

  it('returns an empty state when storage load fails', () => {
    const store = createAppDataStore({
      getItem() {
        throw new Error('storage bridge not ready');
      },
      setItem() {
        throw new Error('storage bridge not ready');
      }
    });

    expect(store.load()).toEqual(createEmptyAppDataState());
    expect(() => store.save(createEmptyAppDataState())).not.toThrow();
  });
});
