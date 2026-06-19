import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createCheckinRepository } from '@/repositories/checkinRepository';
import { createCustomerRepository } from '@/repositories/customerRepository';
import { createMemoryDb } from '@/repositories/db';
import { useCheckinStore } from '@/stores/checkinStore';

describe('check-in store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('matches a voice name and confirms check-in', async () => {
    const db = createMemoryDb();
    const customers = createCustomerRepository(db);
    const checkins = createCheckinRepository(db);
    await customers.create({ name: '张三', phoneLast4: '1234', note: '老顾客' }, '2026-06-01T08:00:00+08:00');

    const store = useCheckinStore();
    store.bindRepositories(customers, checkins);

    await store.searchBySpokenName('张三签到');
    expect(store.candidateCustomers.map((customer) => customer.name)).toEqual(['张三']);

    await store.confirmCheckin('c1', 'voice', false, '2026-06-19T09:00:00+08:00');
    expect(store.recentCheckins).toHaveLength(1);
    expect(store.recentCheckins[0].customerId).toBe('c1');
    expect((await customers.listAll())[0].lastCheckinAt).toBe('2026-06-19T09:00:00+08:00');
  });

  it('requires duplicate confirmation for same-day check-in', async () => {
    const db = createMemoryDb();
    const customers = createCustomerRepository(db);
    const checkins = createCheckinRepository(db);
    await customers.create({ name: '张三' }, '2026-06-01T08:00:00+08:00');
    await checkins.create({
      customerId: 'c1',
      checkedInAt: '2026-06-19T09:00:00+08:00',
      source: 'voice',
      isDuplicateSameDay: false
    });

    const store = useCheckinStore();
    store.bindRepositories(customers, checkins);

    await store.confirmCheckin('c1', 'voice', false, '2026-06-19T10:00:00+08:00');
    expect(store.needsDuplicateConfirmation).toBe(true);
    expect(store.pendingDuplicateCustomerId).toBe('c1');
    expect(await checkins.list()).toHaveLength(1);

    await store.confirmCheckin('c1', 'voice', true, '2026-06-19T10:00:00+08:00');
    expect(store.needsDuplicateConfirmation).toBe(false);
    expect(await checkins.list()).toHaveLength(2);
    expect((await checkins.list())[1].isDuplicateSameDay).toBe(true);
  });

  it('can reverse a recent check-in', async () => {
    const db = createMemoryDb();
    const customers = createCustomerRepository(db);
    const checkins = createCheckinRepository(db);
    await customers.create({ name: '张三' }, '2026-06-01T08:00:00+08:00');

    const store = useCheckinStore();
    store.bindRepositories(customers, checkins);
    await store.confirmCheckin('c1', 'picker', false, '2026-06-19T09:00:00+08:00');
    await store.reverseRecentCheckin('r1', '2026-06-19T09:05:00+08:00');

    expect(store.recentCheckins).toEqual([]);
    expect((await checkins.list())[0].reversedAt).toBe('2026-06-19T09:05:00+08:00');
  });
});
