import type { Customer } from '@/types/domain';
import type { MemoryDb } from './db';

export interface CreateCustomerInput {
  name: string;
  phoneLast4?: string;
  note?: string;
}

export function createCustomerRepository(db: MemoryDb) {
  return {
    async listActive(): Promise<Customer[]> {
      return db.state.customers.filter((customer) => customer.status === 'active');
    },
    async listAll(): Promise<Customer[]> {
      return [...db.state.customers];
    },
    async create(input: CreateCustomerInput, createdAt = new Date().toISOString()): Promise<Customer> {
      const customer: Customer = {
        id: db.nextId('c'),
        name: input.name,
        phoneLast4: input.phoneLast4,
        note: input.note,
        status: 'active',
        createdAt
      };
      db.state.customers.push(customer);
      return customer;
    },
    async updateLastCheckin(customerId: string, checkedInAt: string): Promise<void> {
      const customer = db.state.customers.find((item) => item.id === customerId);
      if (customer) {
        customer.lastCheckinAt = checkedInAt;
      }
    },
    async deactivate(customerId: string): Promise<void> {
      const customer = db.state.customers.find((item) => item.id === customerId);
      if (customer) {
        customer.status = 'inactive';
      }
    }
  };
}

export type CustomerRepository = ReturnType<typeof createCustomerRepository>;
