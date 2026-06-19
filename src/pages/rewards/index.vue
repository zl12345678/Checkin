<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import type { AppDataState } from '@/services/appData';
import { createAppDataStore, deactivateRewardRule, markRewardClaimed, revertRewardClaim, saveRewardRule } from '@/services/appData';
import { calculateRanking } from '@/services/ranking';
import { calculateRewardEligibility } from '@/services/rewards';
import { getMonthRange } from '@/utils/dateRange';

const store = createAppDataStore();
const state = ref<AppDataState>(store.load());
const range = computed(() => getMonthRange(new Date()));
const showCountForm = ref(false);
const showRankForm = ref(false);
const countForm = reactive({ threshold: '3', name: '小礼品' });
const rankForm = reactive({ rankStart: '1', rankEnd: '1', name: '一等奖' });

const periodRules = computed(() => {
  return state.value.rewardRules.filter((rule) => rule.active && rule.period.start === range.value.start && rule.period.end === range.value.end);
});

const allPeriodRules = computed(() => {
  return state.value.rewardRules.filter((rule) => rule.period.start === range.value.start && rule.period.end === range.value.end);
});

const ranking = computed(() => calculateRanking(state.value.customers, state.value.checkins, range.value));
const eligibility = computed(() => {
  return calculateRewardEligibility(state.value.customers, ranking.value, periodRules.value, state.value.rewardClaims);
});
const pendingEligibility = computed(() => eligibility.value.filter((item) => item.status === 'pending'));
const claimedEligibility = computed(() => eligibility.value.filter((item) => item.status === 'claimed'));

function refresh() {
  state.value = store.load();
}

function addCountRule() {
  const threshold = Number(countForm.threshold);
  const name = countForm.name.trim();
  if (!Number.isInteger(threshold) || threshold <= 0 || !name) {
    uni.showToast({ title: '请填写奖励名称和有效次数', icon: 'none' });
    return;
  }
  saveRewardRule(store, {
    kind: 'count',
    name,
    threshold,
    period: range.value,
    active: true
  });
  showCountForm.value = false;
  refresh();
  uni.showToast({ title: '已新增奖励', icon: 'success' });
}

function addRankRule() {
  const rankStart = Number(rankForm.rankStart);
  const rankEnd = Number(rankForm.rankEnd);
  const name = rankForm.name.trim();
  if (!Number.isInteger(rankStart) || !Number.isInteger(rankEnd) || rankStart <= 0 || rankEnd < rankStart || !name) {
    uni.showToast({ title: '请填写有效名次范围', icon: 'none' });
    return;
  }
  saveRewardRule(store, {
    kind: 'ranking',
    name,
    rankStart,
    rankEnd,
    period: range.value,
    active: true
  });
  showRankForm.value = false;
  refresh();
  uni.showToast({ title: '已新增奖励', icon: 'success' });
}

function claim(ruleId: string, customerId: string) {
  markRewardClaimed(store, ruleId, customerId);
  refresh();
  uni.showToast({ title: '已标记领取', icon: 'success' });
}

function revert(ruleId: string, customerId: string) {
  revertRewardClaim(store, ruleId, customerId);
  refresh();
  uni.showToast({ title: '已撤回', icon: 'success' });
}

function stopRule(ruleId: string) {
  deactivateRewardRule(store, ruleId);
  refresh();
  uni.showToast({ title: '已停用奖励', icon: 'success' });
}

onShow(refresh);
</script>

<template>
  <view class="page">
    <text class="title">奖励</text>
    <text class="range">{{ range.start }} 至 {{ range.end }}</text>
    <view class="actions">
      <button type="button" @click="showCountForm = !showCountForm">新增次数奖励</button>
      <button type="button" @click="showRankForm = !showRankForm">新增排名奖励</button>
    </view>

    <view v-if="showCountForm" class="form">
      <input v-model="countForm.threshold" class="field" type="number" placeholder="签到满几次" />
      <input v-model="countForm.name" class="field" placeholder="奖励名称" />
      <button class="primary" type="button" @click="addCountRule">保存次数奖励</button>
    </view>

    <view v-if="showRankForm" class="form">
      <input v-model="rankForm.rankStart" class="field" type="number" placeholder="开始名次" />
      <input v-model="rankForm.rankEnd" class="field" type="number" placeholder="结束名次" />
      <input v-model="rankForm.name" class="field" placeholder="奖励名称" />
      <button class="primary" type="button" @click="addRankRule">保存排名奖励</button>
    </view>

    <view class="section">
      <text class="section-title">奖励档位</text>
      <view v-if="allPeriodRules.length" class="reward-list">
        <view v-for="rule in allPeriodRules" :key="rule.id" class="reward-row">
          <view>
            <text class="reward-name">{{ rule.name }}</text>
            <text class="meta">{{ rule.kind === 'count' ? `签到满 ${rule.threshold} 次` : `第 ${rule.rankStart} 至 ${rule.rankEnd} 名` }} · {{ rule.active ? '启用中' : '已停用' }}</text>
          </view>
          <button v-if="rule.active" class="secondary compact" type="button" @click="stopRule(rule.id)">停用</button>
        </view>
      </view>
      <text v-else class="empty">暂无奖励档位</text>
    </view>

    <view class="section">
      <text class="section-title">待领取</text>
      <view v-if="pendingEligibility.length" class="reward-list">
        <view v-for="item in pendingEligibility" :key="`${item.rule.id}-${item.customer.id}`" class="reward-row">
          <view>
            <text class="reward-name">{{ item.customer.name }} - {{ item.rule.name }}</text>
            <text class="meta">{{ item.rule.kind === 'count' ? `签到满 ${item.rule.threshold} 次` : `第 ${item.rule.rankStart} 至 ${item.rule.rankEnd} 名` }}</text>
          </view>
          <button class="primary compact" type="button" @click="claim(item.rule.id, item.customer.id)">标记领取</button>
        </view>
      </view>
      <text v-else class="empty">暂无待领取奖励</text>
    </view>

    <view class="section">
      <text class="section-title">已领取</text>
      <view v-if="claimedEligibility.length" class="reward-list">
        <view v-for="item in claimedEligibility" :key="`${item.rule.id}-${item.customer.id}`" class="reward-row">
          <view>
            <text class="reward-name">{{ item.customer.name }} - {{ item.rule.name }}</text>
            <text class="meta">{{ item.claim?.claimedAt ? `领取时间 ${item.claim.claimedAt.slice(0, 16).replace('T', ' ')}` : '已领取' }}</text>
          </view>
          <button class="secondary compact" type="button" @click="revert(item.rule.id, item.customer.id)">撤回</button>
        </view>
      </view>
      <text v-else class="empty">暂无已领取奖励</text>
    </view>
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
.range,
.meta {
  color: var(--color-muted);
}
.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
button {
  min-height: var(--touch-min);
  border-radius: var(--radius);
  font-size: var(--font-body);
}
.primary {
  background: var(--color-primary);
  color: #fff;
}
.secondary {
  color: var(--color-danger);
  background: #fff1f0;
}
.compact {
  min-width: 116px;
  padding: 0 var(--space-3);
}
.form,
.section,
.reward-list {
  display: grid;
  gap: var(--space-3);
}
.field {
  min-height: var(--touch-min);
  padding: 0 var(--space-4);
  border: 1px solid #d0d5dd;
  border-radius: var(--radius);
  background: var(--color-surface);
  font-size: var(--font-body);
}
.section-title,
.reward-name {
  font-size: var(--font-title);
  font-weight: 700;
}
.reward-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  border-radius: var(--radius);
  background: var(--color-surface);
}
.empty {
  color: var(--color-muted);
}

@media (max-width: 520px) {
  .actions,
  .reward-row {
    grid-template-columns: 1fr;
  }
  .compact {
    width: 100%;
  }
}
</style>
