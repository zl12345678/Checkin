<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import type { AppDataState } from '@/services/appData';
import { createAppDataStore, createEmptyAppDataState } from '@/services/appData';
import { calculateRanking } from '@/services/ranking';
import { calculateRewardEligibility } from '@/services/rewards';
import { getMonthRange, getPreviousMonthRange } from '@/utils/dateRange';

type RangeMode = 'current' | 'previous';

const store = createAppDataStore();
const state = ref<AppDataState>(createEmptyAppDataState());
const mode = ref<RangeMode>('current');

const range = computed(() => {
  const now = new Date();
  return mode.value === 'current' ? getMonthRange(now) : getPreviousMonthRange(now);
});

const periodRules = computed(() => {
  return state.value.rewardRules.filter((rule) => {
    return rule.active && rule.period.start === range.value.start && rule.period.end === range.value.end;
  });
});

const entries = computed(() => {
  const baseRanking = calculateRanking(state.value.customers, state.value.checkins, range.value);
  const pendingIds = new Set(
    calculateRewardEligibility(state.value.customers, baseRanking, periodRules.value, state.value.rewardClaims)
      .filter((item) => item.status === 'pending')
      .map((item) => item.customer.id)
  );
  return calculateRanking(state.value.customers, state.value.checkins, range.value, pendingIds);
});

function refresh() {
  state.value = store.load();
}

onShow(refresh);
</script>

<template>
  <view class="page">
    <text class="title">排行榜</text>
    <view class="filters">
      <button :class="{ active: mode === 'current' }" type="button" @click="mode = 'current'">本月</button>
      <button :class="{ active: mode === 'previous' }" type="button" @click="mode = 'previous'">上月</button>
    </view>
    <text class="range">{{ range.start }} 至 {{ range.end }}</text>
    <view v-if="entries.length" class="ranking-list">
      <view v-for="entry in entries" :key="entry.customer.id" class="ranking-row">
        <text class="rank">第 {{ entry.rank }} 名</text>
        <view class="customer">
          <text class="name">{{ entry.customer.name }}</text>
          <text class="meta">{{ entry.customer.phoneLast4 ? `尾号 ${entry.customer.phoneLast4}` : '未填手机号' }}</text>
        </view>
        <view class="count">
          <text class="count-number">{{ entry.checkinCount }}</text>
          <text class="meta">次</text>
        </view>
        <text v-if="entry.hasPendingReward" class="pending">待领奖</text>
      </view>
    </view>
    <text v-else class="empty">暂无排行数据</text>
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
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}
button {
  min-height: var(--touch-min);
  border-radius: var(--radius);
}
.active {
  background: var(--color-primary);
  color: #fff;
}
.range {
  color: var(--color-muted);
}
.empty {
  color: var(--color-muted);
}
.ranking-list {
  display: grid;
  gap: var(--space-3);
}
.ranking-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  border-radius: var(--radius);
  background: var(--color-surface);
}
.rank,
.name,
.count-number {
  font-size: var(--font-title);
  font-weight: 700;
}
.meta {
  display: block;
  margin-top: var(--space-2);
  color: var(--color-muted);
}
.count {
  text-align: center;
}
.pending {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
  background: #fff3cd;
  color: #8a5a00;
}

@media (max-width: 560px) {
  .ranking-row {
    grid-template-columns: 1fr auto;
  }
  .rank,
  .pending {
    grid-column: 1 / -1;
  }
}
</style>
