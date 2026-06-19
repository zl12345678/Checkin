import type { Customer } from '@/types/domain';

const CHECKIN_WORDS = ['签到', '打卡', '来了', '到店'];

export function normalizeName(input: string): string {
  let value = input.trim().replace(/\s+/g, '');
  for (const word of CHECKIN_WORDS) {
    value = value.split(word).join('');
  }
  return value;
}

export function matchCustomers(input: string, customers: Customer[]): Customer[] {
  const normalized = normalizeName(input);
  if (!normalized) {
    return [];
  }

  const activeCustomers = customers.filter((customer) => customer.status === 'active');
  const exactMatches = activeCustomers.filter((customer) => customer.name === normalized);
  if (exactMatches.length > 0) {
    return exactMatches;
  }

  return activeCustomers.filter((customer) => {
    return customer.name.includes(normalized) || normalized.includes(customer.name);
  });
}
