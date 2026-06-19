export type CustomerStatus = 'active' | 'inactive';
export type RewardKind = 'count' | 'ranking';
export type RewardClaimStatus = 'pending' | 'claimed';

export interface Customer {
  id: string;
  name: string;
  phoneLast4?: string;
  note?: string;
  status: CustomerStatus;
  createdAt: string;
  lastCheckinAt?: string;
}

export interface CheckinRecord {
  id: string;
  customerId: string;
  checkedInAt: string;
  source: 'voice' | 'handwriting' | 'picker';
  isDuplicateSameDay: boolean;
  reversedAt?: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface RewardRule {
  id: string;
  kind: RewardKind;
  name: string;
  threshold?: number;
  rankStart?: number;
  rankEnd?: number;
  period: DateRange;
  active: boolean;
}

export interface RewardClaim {
  id: string;
  ruleId: string;
  customerId: string;
  status: RewardClaimStatus;
  claimedAt?: string;
  updatedAt: string;
}

export interface RankingEntry {
  rank: number;
  customer: Customer;
  checkinCount: number;
  lastCheckinAt?: string;
  hasPendingReward: boolean;
}

export interface RewardEligibility {
  rule: RewardRule;
  customer: Customer;
  status: RewardClaimStatus;
  claim?: RewardClaim;
}
