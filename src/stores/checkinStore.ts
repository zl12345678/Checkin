import { defineStore } from 'pinia';
import type { CheckinRecord, Customer } from '@/types/domain';
import { matchCustomers } from '@/services/customerMatch';
import type { CheckinRepository } from '@/repositories/checkinRepository';
import type { CustomerRepository } from '@/repositories/customerRepository';

interface CheckinState {
  candidateCustomers: Customer[];
  recentCheckins: CheckinRecord[];
  needsDuplicateConfirmation: boolean;
  pendingDuplicateCustomerId?: string;
}

let customerRepository: CustomerRepository | undefined;
let checkinRepository: CheckinRepository | undefined;

function requireRepositories() {
  if (!customerRepository || !checkinRepository) {
    throw new Error('Check-in repositories are not bound');
  }
  return { customerRepository, checkinRepository };
}

export const useCheckinStore = defineStore('checkin', {
  state: (): CheckinState => ({
    candidateCustomers: [],
    recentCheckins: [],
    needsDuplicateConfirmation: false,
    pendingDuplicateCustomerId: undefined
  }),
  actions: {
    bindRepositories(customers: CustomerRepository, checkins: CheckinRepository) {
      customerRepository = customers;
      checkinRepository = checkins;
    },
    async searchBySpokenName(input: string) {
      const { customerRepository } = requireRepositories();
      this.candidateCustomers = matchCustomers(input, await customerRepository.listActive());
    },
    async confirmCheckin(
      customerId: string,
      source: CheckinRecord['source'],
      allowDuplicate: boolean,
      checkedInAt: string
    ) {
      const { customerRepository, checkinRepository } = requireRepositories();
      const day = checkedInAt.slice(0, 10);
      const hasSameDayCheckin = await checkinRepository.hasCheckinOnDay(customerId, day);

      if (hasSameDayCheckin && !allowDuplicate) {
        this.needsDuplicateConfirmation = true;
        this.pendingDuplicateCustomerId = customerId;
        return;
      }

      await checkinRepository.create({
        customerId,
        checkedInAt,
        source,
        isDuplicateSameDay: hasSameDayCheckin
      });
      await customerRepository.updateLastCheckin(customerId, checkedInAt);
      this.needsDuplicateConfirmation = false;
      this.pendingDuplicateCustomerId = undefined;
      this.recentCheckins = await checkinRepository.listRecent();
    },
    async reverseRecentCheckin(recordId: string, reversedAt: string) {
      const { checkinRepository } = requireRepositories();
      await checkinRepository.reverse(recordId, reversedAt);
      this.recentCheckins = await checkinRepository.listRecent();
    }
  }
});
