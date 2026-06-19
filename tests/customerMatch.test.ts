import { describe, expect, it } from 'vitest';
import type { Customer } from '@/types/domain';
import { matchCustomers, normalizeName } from '@/services/customerMatch';

const customers: Customer[] = [
  { id: 'c1', name: '张三', phoneLast4: '1234', status: 'active', createdAt: '2026-06-01T08:00:00+08:00' },
  { id: 'c2', name: '张丽', phoneLast4: '5678', status: 'active', createdAt: '2026-06-01T08:00:00+08:00' },
  { id: 'c3', name: '张莉', status: 'active', createdAt: '2026-06-01T08:00:00+08:00' },
  { id: 'c4', name: '李四', status: 'inactive', createdAt: '2026-06-01T08:00:00+08:00' }
];

describe('customer matching', () => {
  it('normalizes common check-in phrases', () => {
    expect(normalizeName(' 张三签到 ')).toBe('张三');
    expect(normalizeName('张三 打卡')).toBe('张三');
    expect(normalizeName('张三来了')).toBe('张三');
  });

  it('returns active exact matches first', () => {
    expect(matchCustomers('张三签到', customers).map((customer) => customer.id)).toEqual(['c1']);
  });

  it('returns similar active names when no exact match exists', () => {
    expect(matchCustomers('张', customers).map((customer) => customer.id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('does not return inactive customers', () => {
    expect(matchCustomers('李四', customers)).toEqual([]);
  });
});
