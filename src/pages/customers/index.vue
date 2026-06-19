<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import type { Customer } from '@/types/domain';
import {
  addCustomer as saveCustomer,
  createAppDataStore,
  createCheckin,
  createEmptyAppDataState,
  deactivateCustomer,
  hasCheckinOnDay
} from '@/services/appData';

const store = createAppDataStore();
const customers = ref<Customer[]>(createEmptyAppDataState().customers);
const isAdding = ref(false);
const form = reactive({
  name: '',
  phoneLast4: '',
  note: ''
});
const searchText = ref('');

const activeCustomers = computed(() => {
  const keyword = searchText.value.trim();
  return customers.value
    .filter((customer) => customer.status === 'active')
    .filter((customer) => {
      if (!keyword) {
        return true;
      }
      return customer.name.includes(keyword) || customer.phoneLast4?.includes(keyword) || customer.note?.includes(keyword);
    })
    .sort((left, right) => (right.lastCheckinAt ?? '').localeCompare(left.lastCheckinAt ?? ''));
});

function loadCustomers() {
  customers.value = store.load().customers;
}

function resetForm() {
  form.name = '';
  form.phoneLast4 = '';
  form.note = '';
}

function showAddForm() {
  isAdding.value = true;
}

function cancelAdd() {
  resetForm();
  isAdding.value = false;
}

function addCustomer() {
  const name = form.name.trim();
  const phoneLast4 = form.phoneLast4.trim();

  if (!name) {
    uni.showToast({ title: '请填写姓名', icon: 'none' });
    return;
  }

  if (phoneLast4 && !/^\d{4}$/.test(phoneLast4)) {
    uni.showToast({ title: '手机号后四位需为4位数字', icon: 'none' });
    return;
  }

  saveCustomer(store, {
    name,
    phoneLast4: phoneLast4 || undefined,
    note: form.note.trim() || undefined
  });
  loadCustomers();
  resetForm();
  isAdding.value = false;
  uni.showToast({ title: '已新增顾客', icon: 'success' });
}

function createCustomerCheckin(customer: Customer, allowDuplicate = false) {
  const now = new Date().toISOString();
  const state = store.load();
  const today = now.slice(0, 10);

  if (!allowDuplicate && hasCheckinOnDay(state, customer.id, today)) {
    uni.showModal({
      title: '今天已签到',
      content: `${customer.name} 今天已经签到过，是否再记一次？`,
      confirmText: '再记一次',
      cancelText: '取消',
      success(result) {
        if (result.confirm) {
          createCustomerCheckin(customer, true);
        }
      }
    });
    return;
  }

  createCheckin(store, customer.id, 'picker', now);
  loadCustomers();
  uni.showToast({ title: '签到成功', icon: 'success' });
}

function confirmDeactivate(customer: Customer) {
  uni.showModal({
    title: '停用顾客',
    content: `停用 ${customer.name} 后不会出现在常用名单，历史签到仍会保留。`,
    confirmText: '停用',
    cancelText: '取消',
    success(result) {
      if (result.confirm) {
        deactivateCustomer(store, customer.id);
        loadCustomers();
        uni.showToast({ title: '已停用', icon: 'success' });
      }
    }
  });
}

onShow(loadCustomers);
</script>

<template>
  <view class="page">
    <text class="title">顾客</text>
    <button v-if="!isAdding" type="button" @click="showAddForm">新增顾客</button>
    <input v-model="searchText" class="field" placeholder="搜索姓名、尾号或备注" />

    <view v-if="isAdding" class="form">
      <input v-model="form.name" class="field" placeholder="姓名（必填）" />
      <input v-model="form.phoneLast4" class="field" maxlength="4" type="number" placeholder="手机号后四位（可不填）" />
      <input v-model="form.note" class="field" placeholder="备注（可不填）" />
      <view class="actions">
        <button type="button" @click="cancelAdd">取消</button>
        <button class="primary" type="button" @click="addCustomer">保存</button>
      </view>
    </view>

    <view v-if="activeCustomers.length" class="customer-list">
      <view v-for="customer in activeCustomers" :key="customer.id" class="customer-row">
        <view class="customer-info">
          <text class="customer-name">{{ customer.name }}</text>
          <text class="customer-meta">{{ customer.phoneLast4 ? `尾号 ${customer.phoneLast4}` : '未填手机号' }}</text>
          <text v-if="customer.note" class="customer-meta">{{ customer.note }}</text>
          <text v-if="customer.lastCheckinAt" class="customer-meta">最近签到 {{ customer.lastCheckinAt.slice(0, 10) }}</text>
        </view>
        <view class="row-actions">
          <button class="checkin-button" type="button" @click="createCustomerCheckin(customer)">签到</button>
          <button class="deactivate-button" type="button" @click="confirmDeactivate(customer)">停用</button>
        </view>
      </view>
    </view>

    <text v-else class="empty">{{ customers.length ? '没有找到匹配顾客' : '还没有顾客' }}</text>
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
  border-radius: var(--radius);
  font-size: var(--font-body);
}
.empty {
  color: var(--color-muted);
}
.form,
.customer-list {
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
.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
.primary {
  background: var(--color-primary);
  color: #fff;
}
.customer-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  border-radius: var(--radius);
  background: var(--color-surface);
}
.customer-name {
  display: block;
  font-size: var(--font-title);
  font-weight: 700;
}
.customer-meta {
  display: block;
  margin-top: var(--space-2);
  color: var(--color-muted);
}
.checkin-button {
  min-width: 96px;
  padding: 0 var(--space-4);
  background: var(--color-primary);
  color: #fff;
}
.row-actions {
  display: grid;
  gap: var(--space-2);
}
.deactivate-button {
  min-width: 96px;
  padding: 0 var(--space-4);
  color: var(--color-danger);
  background: #fff1f0;
}

@media (max-width: 420px) {
  .customer-row {
    grid-template-columns: 1fr;
  }
  .checkin-button {
    width: 100%;
  }
  .row-actions {
    grid-template-columns: 1fr 1fr;
  }
  .deactivate-button {
    width: 100%;
  }
}
</style>
