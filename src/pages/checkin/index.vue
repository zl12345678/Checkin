<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import type { Customer } from '@/types/domain';
import type { AppDataState } from '@/services/appData';
import { addCustomer, createAppDataStore, createCheckin, getTodayCheckins, hasCheckinOnDay, reverseCheckin } from '@/services/appData';
import { matchCustomers, normalizeName } from '@/services/customerMatch';

const store = createAppDataStore();
const state = ref<AppDataState>(store.load());
const isInputting = ref(false);
const inputMode = ref<'voice' | 'handwriting'>('voice');
const matchedCustomers = ref<Customer[]>([]);
const spokenForm = reactive({
  text: '',
  phoneLast4: '',
  note: ''
});

const today = computed(() => new Date().toISOString().slice(0, 10));
const todayRecords = computed(() => getTodayCheckins(state.value, today.value));
const activeCustomers = computed(() => state.value.customers.filter((customer) => customer.status === 'active'));
const normalizedInputName = computed(() => normalizeName(spokenForm.text));

function openNameInput(mode: 'voice' | 'handwriting') {
  inputMode.value = mode;
  isInputting.value = true;
  matchedCustomers.value = [];
  spokenForm.text = '';
  spokenForm.phoneLast4 = '';
  spokenForm.note = '';
}

function openCustomerPicker() {
  uni.switchTab({ url: '/pages/customers/index' });
}

function showHandwritingNotice() {
  openNameInput('handwriting');
}

function customerLabel(customerId: string): string {
  const customer = state.value.customers.find((item) => item.id === customerId);
  if (!customer) {
    return '未知顾客';
  }
  return customer.phoneLast4 ? `${customer.name} 尾号${customer.phoneLast4}` : customer.name;
}

function refresh() {
  state.value = store.load();
}

function resetInput() {
  isInputting.value = false;
  matchedCustomers.value = [];
  spokenForm.text = '';
  spokenForm.phoneLast4 = '';
  spokenForm.note = '';
}

function checkinCustomer(customer: Customer, source: 'voice' | 'handwriting', allowDuplicate = false) {
  const now = new Date().toISOString();
  const currentState = store.load();
  const day = now.slice(0, 10);

  if (!allowDuplicate && hasCheckinOnDay(currentState, customer.id, day)) {
    uni.showModal({
      title: '今天已签到',
      content: `${customer.name} 今天已经签到过，是否再记一次？`,
      confirmText: '再记一次',
      cancelText: '取消',
      success(result) {
        if (result.confirm) {
          checkinCustomer(customer, source, true);
        }
      }
    });
    return;
  }

  createCheckin(store, customer.id, source, now);
  refresh();
  resetInput();
  uni.showToast({ title: '签到成功', icon: 'success' });
}

function resolveNameInput() {
  if (!normalizedInputName.value) {
    uni.showToast({ title: '请填写顾客姓名', icon: 'none' });
    return;
  }

  matchedCustomers.value = matchCustomers(spokenForm.text, activeCustomers.value);
  if (matchedCustomers.value.length === 1) {
    checkinCustomer(matchedCustomers.value[0], inputMode.value);
  }
}

function createAndCheckin() {
  const name = normalizedInputName.value;
  const phoneLast4 = spokenForm.phoneLast4.trim();
  if (!name) {
    uni.showToast({ title: '请填写顾客姓名', icon: 'none' });
    return;
  }
  if (phoneLast4 && !/^\d{4}$/.test(phoneLast4)) {
    uni.showToast({ title: '手机号后四位需为4位数字', icon: 'none' });
    return;
  }

  const customer = addCustomer(store, {
    name,
    phoneLast4: phoneLast4 || undefined,
    note: spokenForm.note.trim() || undefined
  });
  checkinCustomer(customer, inputMode.value, true);
}

function confirmReverse(recordId: string) {
  uni.showModal({
    title: '撤销签到',
    content: '确认撤销这条签到记录吗？',
    confirmText: '撤销',
    cancelText: '取消',
    success(result) {
      if (result.confirm) {
        reverseCheckin(store, recordId);
        refresh();
        uni.showToast({ title: '已撤销', icon: 'success' });
      }
    }
  });
}

onShow(refresh);
</script>

<template>
  <view class="page">
    <button class="voice-button" type="button" @click="openNameInput('voice')">语音签到</button>
    <view class="summary">
      <view>
        <text class="summary-number">{{ todayRecords.length }}</text>
        <text class="summary-label">今日签到</text>
      </view>
      <view>
        <text class="summary-number">{{ activeCustomers.length }}</text>
        <text class="summary-label">顾客人数</text>
      </view>
    </view>
    <view class="quick-actions">
      <button type="button" @click="openCustomerPicker">选择名字</button>
      <button type="button" @click="showHandwritingNotice">手写名字</button>
    </view>

    <view v-if="isInputting" class="input-panel">
      <text class="section-title">{{ inputMode === 'voice' ? '语音识别结果' : '手写识别结果' }}</text>
      <input v-model="spokenForm.text" class="field" placeholder="输入或修正顾客姓名" />
      <button class="primary-button" type="button" @click="resolveNameInput">确认姓名</button>

      <view v-if="matchedCustomers.length > 1" class="match-list">
        <text class="hint">找到多个相似顾客，请选择一个</text>
        <button v-for="customer in matchedCustomers" :key="customer.id" class="match-row" type="button" @click="checkinCustomer(customer, inputMode)">
          <text class="record-name">{{ customer.name }}</text>
          <text class="record-meta">{{ customer.phoneLast4 ? `尾号 ${customer.phoneLast4}` : '未填手机号' }}{{ customer.note ? ` · ${customer.note}` : '' }}</text>
        </button>
      </view>

      <view v-if="normalizedInputName && matchedCustomers.length === 0" class="new-customer">
        <text class="hint">没有找到“{{ normalizedInputName }}”，可新建顾客并完成本次签到</text>
        <input v-model="spokenForm.phoneLast4" class="field" maxlength="4" type="number" placeholder="手机号后四位（可不填）" />
        <input v-model="spokenForm.note" class="field" placeholder="备注（可不填）" />
        <button class="primary-button" type="button" @click="createAndCheckin">新建并签到</button>
      </view>

      <button class="cancel-button" type="button" @click="resetInput">取消</button>
    </view>

    <view class="section">
      <text class="section-title">今日签到</text>
      <view v-if="todayRecords.length" class="record-list">
        <view v-for="record in todayRecords" :key="record.id" class="record-row">
          <view>
            <text class="record-name">{{ customerLabel(record.customerId) }}</text>
            <text class="record-meta">{{ record.checkedInAt.slice(11, 16) }} {{ record.isDuplicateSameDay ? '重复签到' : '首次签到' }}</text>
          </view>
          <button class="reverse-button" type="button" @click="confirmReverse(record.id)">撤销</button>
        </view>
      </view>
      <text v-else class="empty">暂无签到记录</text>
    </view>
  </view>
</template>

<style scoped>
.page {
  width: 100vw;
  max-width: 100vw;
  padding: var(--space-5) 0;
  display: grid;
  gap: var(--space-5);
  overflow-x: hidden;
}
.voice-button {
  width: calc(100vw - 40px);
  margin: 0 var(--space-5);
  min-height: 120px;
  border: 0;
  border-radius: var(--radius);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-xl);
  font-weight: 700;
}
.quick-actions {
  width: calc(100vw - 40px);
  margin: 0 var(--space-5);
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}
button {
  width: 100%;
  min-width: 0;
  min-height: var(--touch-min);
  border-radius: var(--radius);
  font-size: var(--font-body);
  padding: 0 var(--space-3);
}
.summary {
  width: calc(100vw - 40px);
  margin: 0 var(--space-5);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
.summary > view {
  padding: var(--space-4);
  border-radius: var(--radius);
  background: var(--color-surface);
}
.summary-number {
  display: block;
  font-size: var(--font-xl);
  font-weight: 700;
}
.summary-label {
  display: block;
  margin-top: var(--space-2);
  color: var(--color-muted);
}
.section-title {
  display: block;
  font-size: var(--font-title);
  font-weight: 700;
}
.section {
  width: calc(100vw - 40px);
  margin: 0 var(--space-5);
}
.input-panel {
  width: calc(100vw - 40px);
  margin: 0 var(--space-5);
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius);
  background: var(--color-surface);
}
.field {
  width: 100%;
  min-height: var(--touch-min);
  padding: 0 var(--space-4);
  border: 1px solid #d0d5dd;
  border-radius: var(--radius);
  background: #fff;
  font-size: var(--font-body);
}
.primary-button {
  background: var(--color-primary);
  color: #fff;
}
.cancel-button {
  background: #eef2f1;
  color: var(--color-text);
}
.match-list,
.new-customer {
  display: grid;
  gap: var(--space-3);
}
.hint {
  color: var(--color-muted);
}
.match-row {
  display: block;
  min-height: 72px;
  padding: var(--space-4);
  text-align: left;
  background: #f8faf9;
}
.empty {
  display: block;
  margin-top: var(--space-3);
  color: var(--color-muted);
}
.record-list {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
.record-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  border-radius: var(--radius);
  background: var(--color-surface);
}
.record-name {
  display: block;
  font-size: var(--font-title);
  font-weight: 700;
}
.record-meta {
  display: block;
  margin-top: var(--space-2);
  color: var(--color-muted);
}
.reverse-button {
  min-width: 88px;
  color: var(--color-danger);
  background: #fff1f0;
}

@media (min-width: 640px) {
  .quick-actions {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
</style>
