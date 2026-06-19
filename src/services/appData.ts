import type { CheckinRecord, Customer, RewardClaim, RewardRule } from '@/types/domain';

export interface AppDataState {
  customers: Customer[];
  checkins: CheckinRecord[];
  rewardRules: RewardRule[];
  rewardClaims: RewardClaim[];
  lastBackupAt?: string;
}

export interface StorageAdapter {
  getItem(key: string): unknown;
  setItem(key: string, value: unknown): void;
}

export interface AppDataStore {
  load(): AppDataState;
  save(state: AppDataState): void;
}

export interface CreateCustomerInput {
  name: string;
  phoneLast4?: string;
  note?: string;
}

const STORAGE_KEY = 'checkin.appData.v1';

export const createEmptyAppDataState = (): AppDataState => ({
  customers: [],
  checkins: [],
  rewardRules: [],
  rewardClaims: []
});

function normalizeState(value: unknown): AppDataState {
  const fallback = createEmptyAppDataState();
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const candidate = value as Partial<AppDataState>;
  return {
    customers: Array.isArray(candidate.customers) ? candidate.customers : [],
    checkins: Array.isArray(candidate.checkins) ? candidate.checkins : [],
    rewardRules: Array.isArray(candidate.rewardRules) ? candidate.rewardRules : [],
    rewardClaims: Array.isArray(candidate.rewardClaims) ? candidate.rewardClaims : [],
    lastBackupAt: candidate.lastBackupAt
  };
}

function nextId(items: Array<{ id: string }>, prefix: string): string {
  const max = items.reduce((highest, item) => {
    const match = item.id.match(new RegExp(`^${prefix}(\\d+)$`));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `${prefix}${max + 1}`;
}

export function createUniStorageAdapter(): StorageAdapter {
  return {
    getItem(key: string): unknown {
      if (typeof uni === 'undefined' || typeof uni.getStorageSync !== 'function') {
        return undefined;
      }
      return uni.getStorageSync(key);
    },
    setItem(key: string, value: unknown): void {
      if (typeof uni === 'undefined' || typeof uni.setStorageSync !== 'function') {
        return;
      }
      uni.setStorageSync(key, value);
    }
  };
}

export function createMemoryStorageAdapter(seed?: AppDataState): StorageAdapter {
  const values = new Map<string, unknown>();
  if (seed) {
    values.set(STORAGE_KEY, seed);
  }

  return {
    getItem(key: string): unknown {
      return values.get(key);
    },
    setItem(key: string, value: unknown): void {
      values.set(key, value);
    }
  };
}

export function createAppDataStore(adapter: StorageAdapter = createUniStorageAdapter()): AppDataStore {
  return {
    load(): AppDataState {
      try {
        return normalizeState(adapter.getItem(STORAGE_KEY));
      } catch (error) {
        return createEmptyAppDataState();
      }
    },
    save(state: AppDataState): void {
      try {
        adapter.setItem(STORAGE_KEY, state);
      } catch (error) {
        return;
      }
    }
  };
}

export function addCustomer(store: AppDataStore, input: CreateCustomerInput, createdAt = new Date().toISOString()): Customer {
  const state = store.load();
  const customer: Customer = {
    id: nextId(state.customers, 'c'),
    name: input.name.trim(),
    phoneLast4: input.phoneLast4?.trim() || undefined,
    note: input.note?.trim() || undefined,
    status: 'active',
    createdAt
  };
  state.customers.unshift(customer);
  store.save(state);
  return customer;
}

export function deactivateCustomer(store: AppDataStore, customerId: string): void {
  const state = store.load();
  const customer = state.customers.find((item) => item.id === customerId);
  if (customer) {
    customer.status = 'inactive';
    store.save(state);
  }
}

export function hasCheckinOnDay(state: AppDataState, customerId: string, day: string): boolean {
  return state.checkins.some((record) => {
    return record.customerId === customerId && !record.reversedAt && record.checkedInAt.slice(0, 10) === day;
  });
}

export function createCheckin(
  store: AppDataStore,
  customerId: string,
  source: CheckinRecord['source'],
  checkedInAt = new Date().toISOString()
): CheckinRecord {
  const state = store.load();
  const day = checkedInAt.slice(0, 10);
  const record: CheckinRecord = {
    id: nextId(state.checkins, 'r'),
    customerId,
    checkedInAt,
    source,
    isDuplicateSameDay: hasCheckinOnDay(state, customerId, day)
  };

  state.checkins.push(record);
  const customer = state.customers.find((item) => item.id === customerId);
  if (customer) {
    customer.lastCheckinAt = checkedInAt;
  }
  store.save(state);
  return record;
}

export function reverseCheckin(store: AppDataStore, recordId: string, reversedAt = new Date().toISOString()): void {
  const state = store.load();
  const record = state.checkins.find((item) => item.id === recordId);
  if (record) {
    record.reversedAt = reversedAt;
    store.save(state);
  }
}

export function getTodayCheckins(state: AppDataState, day = new Date().toISOString().slice(0, 10)): CheckinRecord[] {
  return state.checkins
    .filter((record) => !record.reversedAt && record.checkedInAt.slice(0, 10) === day)
    .sort((left, right) => right.checkedInAt.localeCompare(left.checkedInAt));
}

export function saveRewardRule(store: AppDataStore, rule: Omit<RewardRule, 'id'>): RewardRule {
  const state = store.load();
  const saved: RewardRule = { id: nextId(state.rewardRules, 'rule'), ...rule };
  state.rewardRules.push(saved);
  store.save(state);
  return saved;
}

export function deactivateRewardRule(store: AppDataStore, ruleId: string): void {
  const state = store.load();
  const rule = state.rewardRules.find((item) => item.id === ruleId);
  if (rule) {
    rule.active = false;
    store.save(state);
  }
}

export function markRewardClaimed(store: AppDataStore, ruleId: string, customerId: string, claimedAt = new Date().toISOString()): RewardClaim {
  const state = store.load();
  let claim = state.rewardClaims.find((item) => item.ruleId === ruleId && item.customerId === customerId);
  if (claim) {
    claim.status = 'claimed';
    claim.claimedAt = claimedAt;
    claim.updatedAt = claimedAt;
  } else {
    claim = {
      id: nextId(state.rewardClaims, 'claim'),
      ruleId,
      customerId,
      status: 'claimed',
      claimedAt,
      updatedAt: claimedAt
    };
    state.rewardClaims.push(claim);
  }
  store.save(state);
  return claim;
}

export function revertRewardClaim(store: AppDataStore, ruleId: string, customerId: string, updatedAt = new Date().toISOString()): void {
  const state = store.load();
  const claim = state.rewardClaims.find((item) => item.ruleId === ruleId && item.customerId === customerId);
  if (claim) {
    claim.status = 'pending';
    claim.claimedAt = undefined;
    claim.updatedAt = updatedAt;
    store.save(state);
  }
}

export function markBackupComplete(store: AppDataStore, backedUpAt = new Date().toISOString()): void {
  const state = store.load();
  state.lastBackupAt = backedUpAt;
  store.save(state);
}
