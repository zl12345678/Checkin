# Store Check-In App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a uni-app Android-first single-store customer check-in app with voice-first check-in, local data, rankings, rewards, and backup/export foundations.

**Architecture:** The app is a local-first uni-app project. UI pages consume composables and service modules; service modules call repositories; repositories own local persistence through a single database adapter. This keeps pages focused on interaction and makes ranking/reward logic testable without rendering UI.

**Tech Stack:** uni-app, Vue 3, TypeScript, Pinia, Vitest, local database adapter for App runtime, Android App primary target.

## Global Constraints

- Single-store app.
- First version mainly runs on one device, with data structures kept ready for future multi-device sync.
- Support Android phones and tablets; optimize Android tablet experience first.
- Only store manager or staff operate the app; customers do not self check in.
- Local-first data storage; cloud backup is an enhancement when online.
- Voice check-in is the primary flow.
- Handwriting and name selection are fallback flows.
- Customer identity is `name` plus optional `phoneLast4`.
- Same-day duplicate check-ins are allowed only after staff confirmation.
- Rewards include count-threshold rewards and ranking rewards.
- Reward claims must track pending and claimed states.
- The first version does not include multi-store management, staff permission accounts, customer self check-in, full Excel import, or deep iOS optimization.

---

## File Structure

- Create: `package.json`
  Project scripts and dependencies.
- Create: `tsconfig.json`
  TypeScript compiler settings for app and tests.
- Create: `vitest.config.ts`
  Unit test configuration.
- Create: `src/main.ts`
  uni-app entry point.
- Create: `src/App.vue`
  Root app component.
- Create: `src/pages.json`
  Page routing and bottom tab configuration.
- Create: `src/manifest.json`
  App manifest baseline for Android-first packaging and speech module configuration.
- Create: `src/styles/tokens.scss`
  Shared large-font, spacing, and touch-target tokens.
- Create: `src/types/domain.ts`
  Domain types shared by services, repositories, stores, and pages.
- Create: `src/utils/dateRange.ts`
  Date range helpers for month and custom period statistics.
- Create: `src/services/customerMatch.ts`
  Voice/handwriting result matching against customer records.
- Create: `src/services/ranking.ts`
  Ranking calculation.
- Create: `src/services/rewards.ts`
  Reward eligibility and claim status calculation.
- Create: `src/repositories/db.ts`
  Database adapter interface plus in-memory implementation for tests.
- Create: `src/repositories/customerRepository.ts`
  Customer persistence operations.
- Create: `src/repositories/checkinRepository.ts`
  Check-in persistence operations.
- Create: `src/repositories/rewardRepository.ts`
  Reward rule and claim persistence operations.
- Create: `src/stores/checkinStore.ts`
  Pinia store coordinating customer matching, check-in creation, duplicate confirmation, and recent records.
- Create: `src/stores/rewardStore.ts`
  Pinia store coordinating reward rules and claim state.
- Create: `src/pages/checkin/index.vue`
  Sign-in home page.
- Create: `src/pages/customers/index.vue`
  Customer management page.
- Create: `src/pages/ranking/index.vue`
  Ranking page.
- Create: `src/pages/rewards/index.vue`
  Reward configuration and claim page.
- Create: `src/pages/settings/index.vue`
  Backup, export, speech, and display settings page.
- Create: `src/components/BigActionButton.vue`
  Large primary action button.
- Create: `src/components/ConfirmSheet.vue`
  Large text confirmation sheet.
- Create: `src/components/CustomerPicker.vue`
  Large row customer selection list.
- Create: `src/components/RewardBadge.vue`
  Compact pending/claimed reward status badge.
- Create: `tests/dateRange.test.ts`
  Date range helper tests.
- Create: `tests/customerMatch.test.ts`
  Customer matching tests.
- Create: `tests/ranking.test.ts`
  Ranking tests.
- Create: `tests/rewards.test.ts`
  Reward eligibility tests.
- Create: `tests/checkinStore.test.ts`
  Check-in workflow tests.

## Task 1: Project Skeleton and Shared Types

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/pages.json`
- Create: `src/manifest.json`
- Create: `src/styles/tokens.scss`
- Create: `src/types/domain.ts`

**Interfaces:**
- Produces: `Customer`, `CheckinRecord`, `RewardRule`, `RewardClaim`, `DateRange`, `RankingEntry`, and `RewardEligibility` from `src/types/domain.ts`.

- [ ] **Step 1: Create project scripts and TypeScript test setup**

Create `package.json`:

```json
{
  "name": "store-checkin-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "vue-tsc --noEmit",
    "dev:app": "uni -p app",
    "build:app": "uni build -p app"
  },
  "dependencies": {
    "@dcloudio/uni-app": "^3.0.0",
    "@dcloudio/uni-components": "^3.0.0",
    "@dcloudio/uni-h5": "^3.0.0",
    "pinia": "^2.1.7",
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "@dcloudio/types": "^3.4.0",
    "@dcloudio/vite-plugin-uni": "^3.0.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.0.0",
    "vitest": "^1.6.0",
    "vue-tsc": "^2.0.0"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2020", "DOM"],
    "types": ["@dcloudio/types", "vitest/globals"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "tests/**/*.ts", "vitest.config.ts"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
```

- [ ] **Step 2: Add app entry and route shell**

Create `src/main.ts`:

```ts
import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

export function createApp() {
  const app = createSSRApp(App);
  app.use(createPinia());
  return { app };
}
```

Create `src/App.vue`:

```vue
<script setup lang="ts">
import './styles/tokens.scss';
</script>

<template>
  <slot />
</template>
```

Create `src/pages.json`:

```json
{
  "pages": [
    { "path": "pages/checkin/index", "style": { "navigationBarTitleText": "顾客签到" } },
    { "path": "pages/customers/index", "style": { "navigationBarTitleText": "顾客" } },
    { "path": "pages/ranking/index", "style": { "navigationBarTitleText": "排行榜" } },
    { "path": "pages/rewards/index", "style": { "navigationBarTitleText": "奖励" } },
    { "path": "pages/settings/index", "style": { "navigationBarTitleText": "设置" } }
  ],
  "tabBar": {
    "color": "#5f6368",
    "selectedColor": "#0f766e",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      { "pagePath": "pages/checkin/index", "text": "签到" },
      { "pagePath": "pages/customers/index", "text": "顾客" },
      { "pagePath": "pages/ranking/index", "text": "排行" },
      { "pagePath": "pages/rewards/index", "text": "奖励" }
    ]
  }
}
```

Create `src/manifest.json`:

```json
{
  "name": "门店顾客签到",
  "appid": "__UNI__STORE_CHECKIN",
  "description": "单店顾客签到、排行和奖励管理",
  "versionName": "0.1.0",
  "versionCode": 1,
  "app-plus": {
    "modules": {
      "Speech": {},
      "SQLite": {}
    },
    "distribute": {
      "android": {
        "permissions": [
          "<uses-permission android:name=\"android.permission.RECORD_AUDIO\"/>"
        ]
      }
    }
  }
}
```

- [ ] **Step 3: Add shared style tokens**

Create `src/styles/tokens.scss`:

```scss
:root {
  --color-bg: #f7f7f4;
  --color-surface: #ffffff;
  --color-text: #1f2933;
  --color-muted: #667085;
  --color-primary: #0f766e;
  --color-danger: #b42318;
  --radius: 8px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --font-body: 18px;
  --font-title: 24px;
  --font-xl: 32px;
  --touch-min: 56px;
}

page {
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--font-body);
}
```

- [ ] **Step 4: Add domain types**

Create `src/types/domain.ts`:

```ts
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
```

- [ ] **Step 5: Run setup checks**

Run: `npm install`

Expected: dependencies install without package resolution errors.

Run: `npm run test`

Expected: `No test files found` or an equivalent Vitest no-tests message.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts src
git commit -m "chore: scaffold uni-app project"
```

## Task 2: Date Helpers, Customer Matching, and Ranking Logic

**Files:**
- Create: `src/utils/dateRange.ts`
- Create: `src/services/customerMatch.ts`
- Create: `src/services/ranking.ts`
- Create: `tests/dateRange.test.ts`
- Create: `tests/customerMatch.test.ts`
- Create: `tests/ranking.test.ts`

**Interfaces:**
- Consumes: `Customer`, `CheckinRecord`, `DateRange`, `RankingEntry`.
- Produces: `getMonthRange(date: Date): DateRange`, `getPreviousMonthRange(date: Date): DateRange`, `normalizeName(input: string): string`, `matchCustomers(input: string, customers: Customer[]): Customer[]`, `calculateRanking(customers: Customer[], checkins: CheckinRecord[], range: DateRange, pendingRewardCustomerIds?: Set<string>): RankingEntry[]`.

- [ ] **Step 1: Write date helper tests**

Create `tests/dateRange.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getMonthRange, getPreviousMonthRange } from '@/utils/dateRange';

describe('date ranges', () => {
  it('returns the current month range in local date format', () => {
    expect(getMonthRange(new Date('2026-06-19T10:00:00+08:00'))).toEqual({
      start: '2026-06-01',
      end: '2026-06-30'
    });
  });

  it('returns the previous month range across year boundaries', () => {
    expect(getPreviousMonthRange(new Date('2026-01-05T10:00:00+08:00'))).toEqual({
      start: '2025-12-01',
      end: '2025-12-31'
    });
  });
});
```

Run: `npm run test -- tests/dateRange.test.ts`

Expected: FAIL because `src/utils/dateRange.ts` does not exist.

- [ ] **Step 2: Implement date helpers**

Create `src/utils/dateRange.ts`:

```ts
import type { DateRange } from '@/types/domain';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthRange(year: number, monthIndex: number): DateRange {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  return {
    start: formatDate(start),
    end: formatDate(end)
  };
}

export function getMonthRange(date: Date): DateRange {
  return monthRange(date.getFullYear(), date.getMonth());
}

export function getPreviousMonthRange(date: Date): DateRange {
  return monthRange(date.getFullYear(), date.getMonth() - 1);
}

export function isDateInRange(isoDateTime: string, range: DateRange): boolean {
  const day = isoDateTime.slice(0, 10);
  return day >= range.start && day <= range.end;
}
```

Run: `npm run test -- tests/dateRange.test.ts`

Expected: PASS.

- [ ] **Step 3: Write customer matching tests**

Create `tests/customerMatch.test.ts`:

```ts
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
  });

  it('returns active exact matches first', () => {
    expect(matchCustomers('张三签到', customers).map((item) => item.id)).toEqual(['c1']);
  });

  it('returns similar active names when no exact match exists', () => {
    expect(matchCustomers('张', customers).map((item) => item.id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('does not return inactive customers', () => {
    expect(matchCustomers('李四', customers)).toEqual([]);
  });
});
```

Run: `npm run test -- tests/customerMatch.test.ts`

Expected: FAIL because `src/services/customerMatch.ts` does not exist.

- [ ] **Step 4: Implement customer matching**

Create `src/services/customerMatch.ts`:

```ts
import type { Customer } from '@/types/domain';

const CHECKIN_WORDS = ['签到', '打卡', '来了', '到店'];

export function normalizeName(input: string): string {
  let value = input.trim().replace(/\s+/g, '');
  for (const word of CHECKIN_WORDS) {
    value = value.replaceAll(word, '');
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
```

Run: `npm run test -- tests/customerMatch.test.ts`

Expected: PASS.

- [ ] **Step 5: Write ranking tests**

Create `tests/ranking.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { CheckinRecord, Customer, DateRange } from '@/types/domain';
import { calculateRanking } from '@/services/ranking';

const customers: Customer[] = [
  { id: 'c1', name: '张三', status: 'active', createdAt: '2026-06-01T08:00:00+08:00' },
  { id: 'c2', name: '李四', status: 'active', createdAt: '2026-06-01T08:00:00+08:00' }
];

const range: DateRange = { start: '2026-06-01', end: '2026-06-30' };

describe('ranking', () => {
  it('counts active check-ins in the selected period', () => {
    const checkins: CheckinRecord[] = [
      { id: 'r1', customerId: 'c1', checkedInAt: '2026-06-02T09:00:00+08:00', source: 'voice', isDuplicateSameDay: false },
      { id: 'r2', customerId: 'c1', checkedInAt: '2026-06-03T09:00:00+08:00', source: 'voice', isDuplicateSameDay: false },
      { id: 'r3', customerId: 'c2', checkedInAt: '2026-06-04T09:00:00+08:00', source: 'picker', isDuplicateSameDay: false },
      { id: 'r4', customerId: 'c2', checkedInAt: '2026-07-01T09:00:00+08:00', source: 'picker', isDuplicateSameDay: false },
      { id: 'r5', customerId: 'c2', checkedInAt: '2026-06-05T09:00:00+08:00', source: 'picker', isDuplicateSameDay: false, reversedAt: '2026-06-05T09:10:00+08:00' }
    ];

    expect(calculateRanking(customers, checkins, range).map((entry) => ({
      rank: entry.rank,
      id: entry.customer.id,
      count: entry.checkinCount
    }))).toEqual([
      { rank: 1, id: 'c1', count: 2 },
      { rank: 2, id: 'c2', count: 1 }
    ]);
  });

  it('marks pending rewards by customer id', () => {
    const checkins: CheckinRecord[] = [
      { id: 'r1', customerId: 'c1', checkedInAt: '2026-06-02T09:00:00+08:00', source: 'voice', isDuplicateSameDay: false }
    ];

    expect(calculateRanking(customers, checkins, range, new Set(['c1']))[0].hasPendingReward).toBe(true);
  });
});
```

Run: `npm run test -- tests/ranking.test.ts`

Expected: FAIL because `src/services/ranking.ts` does not exist.

- [ ] **Step 6: Implement ranking**

Create `src/services/ranking.ts`:

```ts
import type { CheckinRecord, Customer, DateRange, RankingEntry } from '@/types/domain';
import { isDateInRange } from '@/utils/dateRange';

export function calculateRanking(
  customers: Customer[],
  checkins: CheckinRecord[],
  range: DateRange,
  pendingRewardCustomerIds = new Set<string>()
): RankingEntry[] {
  const activeCheckins = checkins.filter((record) => {
    return !record.reversedAt && isDateInRange(record.checkedInAt, range);
  });

  const byCustomer = new Map<string, CheckinRecord[]>();
  for (const record of activeCheckins) {
    const records = byCustomer.get(record.customerId) ?? [];
    records.push(record);
    byCustomer.set(record.customerId, records);
  }

  return customers
    .filter((customer) => customer.status === 'active')
    .map((customer) => {
      const records = byCustomer.get(customer.id) ?? [];
      const lastCheckinAt = records
        .map((record) => record.checkedInAt)
        .sort()
        .at(-1);

      return {
        rank: 0,
        customer,
        checkinCount: records.length,
        lastCheckinAt,
        hasPendingReward: pendingRewardCustomerIds.has(customer.id)
      };
    })
    .filter((entry) => entry.checkinCount > 0)
    .sort((left, right) => {
      if (right.checkinCount !== left.checkinCount) {
        return right.checkinCount - left.checkinCount;
      }
      return (left.lastCheckinAt ?? '').localeCompare(right.lastCheckinAt ?? '');
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
}
```

Run: `npm run test -- tests/dateRange.test.ts tests/customerMatch.test.ts tests/ranking.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/utils/dateRange.ts src/services/customerMatch.ts src/services/ranking.ts tests/dateRange.test.ts tests/customerMatch.test.ts tests/ranking.test.ts
git commit -m "feat: add check-in ranking foundations"
```

## Task 3: Local Repositories and Check-In Workflow Store

**Files:**
- Create: `src/repositories/db.ts`
- Create: `src/repositories/customerRepository.ts`
- Create: `src/repositories/checkinRepository.ts`
- Create: `src/stores/checkinStore.ts`
- Create: `tests/checkinStore.test.ts`

**Interfaces:**
- Consumes: domain types and `matchCustomers`.
- Produces: `createMemoryDb(seed?: Partial<MemoryDbState>): MemoryDb`, `createCustomerRepository(db)`, `createCheckinRepository(db)`, `useCheckinStore()`.

- [ ] **Step 1: Write check-in workflow tests**

Create `tests/checkinStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryDb } from '@/repositories/db';
import { createCustomerRepository } from '@/repositories/customerRepository';
import { createCheckinRepository } from '@/repositories/checkinRepository';
import { useCheckinStore } from '@/stores/checkinStore';

describe('check-in store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('matches a voice name and confirms check-in', async () => {
    const db = createMemoryDb();
    const customers = createCustomerRepository(db);
    const checkins = createCheckinRepository(db);
    await customers.create({ name: '张三', phoneLast4: '1234', note: '老顾客' });

    const store = useCheckinStore();
    store.bindRepositories(customers, checkins);

    await store.searchBySpokenName('张三签到');
    expect(store.candidateCustomers.map((customer) => customer.name)).toEqual(['张三']);

    await store.confirmCheckin('c1', 'voice', false, '2026-06-19T09:00:00+08:00');
    expect(store.recentCheckins).toHaveLength(1);
    expect(store.recentCheckins[0].customerId).toBe('c1');
  });

  it('requires duplicate confirmation for same-day check-in', async () => {
    const db = createMemoryDb();
    const customers = createCustomerRepository(db);
    const checkins = createCheckinRepository(db);
    await customers.create({ name: '张三' });
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

    await store.confirmCheckin('c1', 'voice', true, '2026-06-19T10:00:00+08:00');
    expect(store.needsDuplicateConfirmation).toBe(false);
    expect(await checkins.list()).toHaveLength(2);
  });
});
```

Run: `npm run test -- tests/checkinStore.test.ts`

Expected: FAIL because repository and store modules do not exist.

- [ ] **Step 2: Implement memory database**

Create `src/repositories/db.ts`:

```ts
import type { CheckinRecord, Customer, RewardClaim, RewardRule } from '@/types/domain';

export interface MemoryDbState {
  customers: Customer[];
  checkins: CheckinRecord[];
  rewardRules: RewardRule[];
  rewardClaims: RewardClaim[];
}

export interface MemoryDb {
  state: MemoryDbState;
  nextId(prefix: string): string;
}

export function createMemoryDb(seed: Partial<MemoryDbState> = {}): MemoryDb {
  const counters = new Map<string, number>();
  return {
    state: {
      customers: seed.customers ?? [],
      checkins: seed.checkins ?? [],
      rewardRules: seed.rewardRules ?? [],
      rewardClaims: seed.rewardClaims ?? []
    },
    nextId(prefix: string): string {
      const next = (counters.get(prefix) ?? 0) + 1;
      counters.set(prefix, next);
      return `${prefix}${next}`;
    }
  };
}
```

- [ ] **Step 3: Implement customer repository**

Create `src/repositories/customerRepository.ts`:

```ts
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
    async create(input: CreateCustomerInput): Promise<Customer> {
      const customer: Customer = {
        id: db.nextId('c'),
        name: input.name,
        phoneLast4: input.phoneLast4,
        note: input.note,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      db.state.customers.push(customer);
      return customer;
    },
    async updateLastCheckin(customerId: string, checkedInAt: string): Promise<void> {
      const customer = db.state.customers.find((item) => item.id === customerId);
      if (customer) {
        customer.lastCheckinAt = checkedInAt;
      }
    }
  };
}

export type CustomerRepository = ReturnType<typeof createCustomerRepository>;
```

- [ ] **Step 4: Implement check-in repository**

Create `src/repositories/checkinRepository.ts`:

```ts
import type { CheckinRecord } from '@/types/domain';
import type { MemoryDb } from './db';

export interface CreateCheckinInput {
  customerId: string;
  checkedInAt: string;
  source: CheckinRecord['source'];
  isDuplicateSameDay: boolean;
}

export function createCheckinRepository(db: MemoryDb) {
  return {
    async list(): Promise<CheckinRecord[]> {
      return [...db.state.checkins];
    },
    async listRecent(limit = 5): Promise<CheckinRecord[]> {
      return [...db.state.checkins]
        .filter((record) => !record.reversedAt)
        .sort((left, right) => right.checkedInAt.localeCompare(left.checkedInAt))
        .slice(0, limit);
    },
    async hasCheckinOnDay(customerId: string, day: string): Promise<boolean> {
      return db.state.checkins.some((record) => {
        return record.customerId === customerId && !record.reversedAt && record.checkedInAt.slice(0, 10) === day;
      });
    },
    async create(input: CreateCheckinInput): Promise<CheckinRecord> {
      const record: CheckinRecord = {
        id: db.nextId('r'),
        ...input
      };
      db.state.checkins.push(record);
      return record;
    },
    async reverse(recordId: string, reversedAt: string): Promise<void> {
      const record = db.state.checkins.find((item) => item.id === recordId);
      if (record) {
        record.reversedAt = reversedAt;
      }
    }
  };
}

export type CheckinRepository = ReturnType<typeof createCheckinRepository>;
```

- [ ] **Step 5: Implement check-in store**

Create `src/stores/checkinStore.ts`:

```ts
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
    }
  }
});
```

Run: `npm run test -- tests/checkinStore.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/repositories src/stores/checkinStore.ts tests/checkinStore.test.ts
git commit -m "feat: add local check-in workflow"
```

## Task 4: Reward Eligibility Logic

**Files:**
- Create: `src/services/rewards.ts`
- Create: `src/repositories/rewardRepository.ts`
- Create: `src/stores/rewardStore.ts`
- Create: `tests/rewards.test.ts`

**Interfaces:**
- Consumes: `Customer`, `RankingEntry`, `RewardRule`, `RewardClaim`.
- Produces: `calculateRewardEligibility(customers, ranking, rules, claims): RewardEligibility[]`, `createRewardRepository(db)`, `useRewardStore()`.

- [ ] **Step 1: Write reward eligibility tests**

Create `tests/rewards.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Customer, RankingEntry, RewardClaim, RewardRule } from '@/types/domain';
import { calculateRewardEligibility } from '@/services/rewards';

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
```

Run: `npm run test -- tests/rewards.test.ts`

Expected: FAIL because `src/services/rewards.ts` does not exist.

- [ ] **Step 2: Implement reward eligibility**

Create `src/services/rewards.ts`:

```ts
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
```

Run: `npm run test -- tests/rewards.test.ts`

Expected: PASS.

- [ ] **Step 3: Implement reward repository and store**

Create `src/repositories/rewardRepository.ts`:

```ts
import type { RewardClaim, RewardRule } from '@/types/domain';
import type { MemoryDb } from './db';

export function createRewardRepository(db: MemoryDb) {
  return {
    async listRules(): Promise<RewardRule[]> {
      return [...db.state.rewardRules];
    },
    async saveRule(rule: Omit<RewardRule, 'id'>): Promise<RewardRule> {
      const saved: RewardRule = { id: db.nextId('rule'), ...rule };
      db.state.rewardRules.push(saved);
      return saved;
    },
    async listClaims(): Promise<RewardClaim[]> {
      return [...db.state.rewardClaims];
    },
    async markClaimed(ruleId: string, customerId: string, claimedAt: string): Promise<RewardClaim> {
      const existing = db.state.rewardClaims.find((claim) => claim.ruleId === ruleId && claim.customerId === customerId);
      if (existing) {
        existing.status = 'claimed';
        existing.claimedAt = claimedAt;
        existing.updatedAt = claimedAt;
        return existing;
      }

      const claim: RewardClaim = {
        id: db.nextId('claim'),
        ruleId,
        customerId,
        status: 'claimed',
        claimedAt,
        updatedAt: claimedAt
      };
      db.state.rewardClaims.push(claim);
      return claim;
    },
    async revertClaim(ruleId: string, customerId: string, updatedAt: string): Promise<void> {
      const existing = db.state.rewardClaims.find((claim) => claim.ruleId === ruleId && claim.customerId === customerId);
      if (existing) {
        existing.status = 'pending';
        existing.claimedAt = undefined;
        existing.updatedAt = updatedAt;
      }
    }
  };
}

export type RewardRepository = ReturnType<typeof createRewardRepository>;
```

Create `src/stores/rewardStore.ts`:

```ts
import { defineStore } from 'pinia';
import type { Customer, RankingEntry, RewardEligibility, RewardRule } from '@/types/domain';
import type { RewardRepository } from '@/repositories/rewardRepository';
import { calculateRewardEligibility } from '@/services/rewards';

let rewardRepository: RewardRepository | undefined;

function requireRewardRepository(): RewardRepository {
  if (!rewardRepository) {
    throw new Error('Reward repository is not bound');
  }
  return rewardRepository;
}

export const useRewardStore = defineStore('rewards', {
  state: () => ({
    eligibility: [] as RewardEligibility[]
  }),
  actions: {
    bindRepository(repository: RewardRepository) {
      rewardRepository = repository;
    },
    async addRule(rule: Omit<RewardRule, 'id'>) {
      await requireRewardRepository().saveRule(rule);
    },
    async refreshEligibility(customers: Customer[], ranking: RankingEntry[]) {
      const repository = requireRewardRepository();
      this.eligibility = calculateRewardEligibility(
        customers,
        ranking,
        await repository.listRules(),
        await repository.listClaims()
      );
    },
    async markClaimed(ruleId: string, customerId: string, claimedAt: string) {
      await requireRewardRepository().markClaimed(ruleId, customerId, claimedAt);
    },
    async revertClaim(ruleId: string, customerId: string, updatedAt: string) {
      await requireRewardRepository().revertClaim(ruleId, customerId, updatedAt);
    }
  }
});
```

Run: `npm run test -- tests/rewards.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/services/rewards.ts src/repositories/rewardRepository.ts src/stores/rewardStore.ts tests/rewards.test.ts
git commit -m "feat: add reward eligibility workflow"
```

## Task 5: Core UI Pages and Components

**Files:**
- Create: `src/components/BigActionButton.vue`
- Create: `src/components/ConfirmSheet.vue`
- Create: `src/components/CustomerPicker.vue`
- Create: `src/components/RewardBadge.vue`
- Create: `src/pages/checkin/index.vue`
- Create: `src/pages/customers/index.vue`
- Create: `src/pages/ranking/index.vue`
- Create: `src/pages/rewards/index.vue`
- Create: `src/pages/settings/index.vue`

**Interfaces:**
- Consumes: Pinia stores and domain types.
- Produces: navigable pages that expose the first version's workflows with large text and large touch targets.

- [ ] **Step 1: Create reusable components**

Create `src/components/BigActionButton.vue`:

```vue
<script setup lang="ts">
defineProps<{
  label: string;
  hint?: string;
}>();
</script>

<template>
  <button class="big-action" type="button">
    <span class="label">{{ label }}</span>
    <span v-if="hint" class="hint">{{ hint }}</span>
  </button>
</template>

<style scoped>
.big-action {
  width: 100%;
  min-height: 120px;
  border: 0;
  border-radius: var(--radius);
  background: var(--color-primary);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--space-2);
}
.label {
  font-size: var(--font-xl);
  font-weight: 700;
}
.hint {
  font-size: var(--font-body);
}
```

Create `src/components/ConfirmSheet.vue`:

```vue
<script setup lang="ts">
defineProps<{
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}>();

defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <view class="sheet">
    <text class="title">{{ title }}</text>
    <text class="message">{{ message }}</text>
    <view class="actions">
      <button class="secondary" type="button" @click="$emit('cancel')">{{ cancelText }}</button>
      <button class="primary" type="button" @click="$emit('confirm')">{{ confirmText }}</button>
    </view>
  </view>
</template>

<style scoped>
.sheet {
  padding: var(--space-5);
  background: var(--color-surface);
  border-radius: var(--radius);
}
.title {
  display: block;
  font-size: var(--font-title);
  font-weight: 700;
}
.message {
  display: block;
  margin-top: var(--space-3);
  color: var(--color-muted);
}
.actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-5);
}
button {
  flex: 1;
  min-height: var(--touch-min);
  border-radius: var(--radius);
}
.primary {
  background: var(--color-primary);
  color: #fff;
}
.secondary {
  background: #eef2f1;
  color: var(--color-text);
}
```

Create `src/components/CustomerPicker.vue`:

```vue
<script setup lang="ts">
import type { Customer } from '@/types/domain';

defineProps<{
  customers: Customer[];
}>();

defineEmits<{
  select: [customer: Customer];
}>();
</script>

<template>
  <view class="list">
    <button v-for="customer in customers" :key="customer.id" class="row" type="button" @click="$emit('select', customer)">
      <text class="name">{{ customer.name }}</text>
      <text class="meta">{{ customer.phoneLast4 ? `尾号 ${customer.phoneLast4}` : '未填手机号' }}</text>
    </button>
  </view>
</template>

<style scoped>
.list {
  display: grid;
  gap: var(--space-3);
}
.row {
  min-height: 72px;
  padding: var(--space-4);
  border-radius: var(--radius);
  background: var(--color-surface);
  text-align: left;
}
.name {
  display: block;
  font-size: var(--font-title);
  font-weight: 700;
}
.meta {
  display: block;
  margin-top: var(--space-2);
  color: var(--color-muted);
}
```

Create `src/components/RewardBadge.vue`:

```vue
<script setup lang="ts">
defineProps<{
  status: 'pending' | 'claimed';
}>();
</script>

<template>
  <text :class="['badge', status]">{{ status === 'pending' ? '待领取' : '已领取' }}</text>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 var(--space-3);
  border-radius: var(--radius);
  font-size: 16px;
}
.pending {
  background: #fff3cd;
  color: #8a5a00;
}
.claimed {
  background: #dcfce7;
  color: #166534;
}
```

- [ ] **Step 2: Create initial pages wired to the navigation**

Create `src/pages/checkin/index.vue`:

```vue
<script setup lang="ts">
import BigActionButton from '@/components/BigActionButton.vue';
</script>

<template>
  <view class="page">
    <BigActionButton label="语音签到" hint="点一下，说顾客姓名" />
    <view class="quick-actions">
      <button type="button">选择名字</button>
      <button type="button">手写名字</button>
    </view>
    <section>
      <text class="section-title">今日签到</text>
      <text class="empty">暂无签到记录</text>
    </section>
  </view>
</template>

<style scoped>
.page {
  padding: var(--space-5);
  display: grid;
  gap: var(--space-5);
}
.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
button {
  min-height: var(--touch-min);
  border-radius: var(--radius);
}
.section-title {
  display: block;
  font-size: var(--font-title);
  font-weight: 700;
}
.empty {
  display: block;
  margin-top: var(--space-3);
  color: var(--color-muted);
}
```

Create `src/pages/customers/index.vue`:

```vue
<template>
  <view class="page">
    <text class="title">顾客</text>
    <button type="button">新增顾客</button>
    <text class="empty">还没有顾客</text>
  </view>
</template>

<style scoped>
.page {
  padding: var(--space-5);
  display: grid;
  gap: var(--space-4);
}
.title {
  font-size: var(--font-title);
  font-weight: 700;
}
button {
  min-height: var(--touch-min);
}
.empty {
  color: var(--color-muted);
}
```

Create `src/pages/ranking/index.vue`:

```vue
<template>
  <view class="page">
    <text class="title">排行榜</text>
    <view class="filters">
      <button type="button">本月</button>
      <button type="button">上月</button>
      <button type="button">自定义</button>
    </view>
    <text class="empty">暂无排行数据</text>
  </view>
</template>

<style scoped>
.page {
  padding: var(--space-5);
  display: grid;
  gap: var(--space-4);
}
.title {
  font-size: var(--font-title);
  font-weight: 700;
}
.filters {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}
button {
  min-height: var(--touch-min);
}
.empty {
  color: var(--color-muted);
}
```

Create `src/pages/rewards/index.vue`:

```vue
<template>
  <view class="page">
    <text class="title">奖励</text>
    <button type="button">新增次数奖励</button>
    <button type="button">新增排名奖励</button>
    <text class="empty">暂无待领取奖励</text>
  </view>
</template>

<style scoped>
.page {
  padding: var(--space-5);
  display: grid;
  gap: var(--space-4);
}
.title {
  font-size: var(--font-title);
  font-weight: 700;
}
button {
  min-height: var(--touch-min);
}
.empty {
  color: var(--color-muted);
}
```

Create `src/pages/settings/index.vue`:

```vue
<template>
  <view class="page">
    <text class="title">设置</text>
    <button type="button">备份数据</button>
    <button type="button">导出数据</button>
    <button type="button">字号设置</button>
  </view>
</template>

<style scoped>
.page {
  padding: var(--space-5);
  display: grid;
  gap: var(--space-4);
}
.title {
  font-size: var(--font-title);
  font-weight: 700;
}
button {
  min-height: var(--touch-min);
}
```

- [ ] **Step 3: Run checks**

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run test`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components src/pages
git commit -m "feat: add core app pages"
```

## Task 6: App Runtime Adapters, Backup Metadata, and Final Validation

**Files:**
- Modify: `src/repositories/db.ts`
- Create: `src/services/backup.ts`
- Create: `tests/backup.test.ts`
- Modify: `src/pages/settings/index.vue`
- Modify: `docs/superpowers/plans/2026-06-19-store-checkin-app-implementation-plan.md`

**Interfaces:**
- Consumes: `MemoryDbState`.
- Produces: `createBackupSnapshot(state: MemoryDbState, exportedAt: string): BackupSnapshot`.

- [ ] **Step 1: Write backup snapshot tests**

Create `tests/backup.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createMemoryDb } from '@/repositories/db';
import { createBackupSnapshot } from '@/services/backup';

describe('backup snapshot', () => {
  it('exports all local data with an export timestamp', () => {
    const db = createMemoryDb({
      customers: [{ id: 'c1', name: '张三', status: 'active', createdAt: '2026-06-01T08:00:00+08:00' }],
      checkins: [{ id: 'r1', customerId: 'c1', checkedInAt: '2026-06-19T09:00:00+08:00', source: 'voice', isDuplicateSameDay: false }]
    });

    expect(createBackupSnapshot(db.state, '2026-06-19T10:00:00+08:00')).toEqual({
      exportedAt: '2026-06-19T10:00:00+08:00',
      version: 1,
      customers: db.state.customers,
      checkins: db.state.checkins,
      rewardRules: [],
      rewardClaims: []
    });
  });
});
```

Run: `npm run test -- tests/backup.test.ts`

Expected: FAIL because `src/services/backup.ts` does not exist.

- [ ] **Step 2: Implement backup snapshot service**

Create `src/services/backup.ts`:

```ts
import type { MemoryDbState } from '@/repositories/db';

export interface BackupSnapshot extends MemoryDbState {
  version: 1;
  exportedAt: string;
}

export function createBackupSnapshot(state: MemoryDbState, exportedAt: string): BackupSnapshot {
  return {
    version: 1,
    exportedAt,
    customers: [...state.customers],
    checkins: [...state.checkins],
    rewardRules: [...state.rewardRules],
    rewardClaims: [...state.rewardClaims]
  };
}
```

Run: `npm run test -- tests/backup.test.ts`

Expected: PASS.

- [ ] **Step 3: Add backup status copy to settings page**

Modify `src/pages/settings/index.vue` to:

```vue
<template>
  <view class="page">
    <text class="title">设置</text>
    <text class="backup-status">最近备份：还没有备份</text>
    <button type="button">备份数据</button>
    <button type="button">导出数据</button>
    <button type="button">字号设置</button>
  </view>
</template>

<style scoped>
.page {
  padding: var(--space-5);
  display: grid;
  gap: var(--space-4);
}
.title {
  font-size: var(--font-title);
  font-weight: 700;
}
.backup-status {
  color: var(--color-muted);
}
button {
  min-height: var(--touch-min);
}
```

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run test`

Expected: PASS.

- [ ] **Step 4: Manual Android-first validation**

Run: `npm run dev:app`

Expected: uni-app starts the App dev target without route or manifest parse errors.

Check on Android phone viewport:

- The sign-in home page opens first.
- The voice sign-in button is visually dominant.
- The “选择名字” and “手写名字” buttons are visible without horizontal scrolling.

Check on Android tablet viewport:

- The sign-in button remains centered and readable.
- Bottom navigation labels are readable.
- No page requires tiny tap targets for the first screen.

- [ ] **Step 5: Commit**

```bash
git add src/services/backup.ts src/pages/settings/index.vue tests/backup.test.ts docs/superpowers/plans/2026-06-19-store-checkin-app-implementation-plan.md
git commit -m "feat: add backup export foundation"
```

## Self-Review

- Spec coverage: Tasks cover uni-app skeleton, Android-first page shell, local-first data interfaces, voice-name matching, duplicate confirmation, ranking, count/ranking rewards, claim status, backup/export foundation, and large-touch UI. Full Excel import, multi-store, staff accounts, customer self check-in, and deep iOS optimization remain outside first-version scope as specified.
- Completion scan: The plan contains no unfilled markers and no unfinished sections.
- Type consistency: `Customer`, `CheckinRecord`, `RewardRule`, `RewardClaim`, `DateRange`, `RankingEntry`, and `RewardEligibility` are defined in Task 1 and reused consistently by later services, repositories, stores, and tests.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-19-store-checkin-app-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
