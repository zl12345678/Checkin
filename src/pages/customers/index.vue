<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import type { Customer } from '@/types/domain';

const STORAGE_KEY = 'checkin.customers';

const customers = ref<Customer[]>([]);
const isAdding = ref(false);
const form = reactive({
  name: '',
  phoneLast4: '',
  note: ''
});

const activeCustomers = computed(() => customers.value.filter((customer) => customer.status === 'active'));

function loadCustomers() {
  const saved = uni.getStorageSync(STORAGE_KEY);
  customers.value = Array.isArray(saved) ? saved : [];
}

function saveCustomers() {
  uni.setStorageSync(STORAGE_KEY, customers.value);
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

  customers.value.unshift({
    id: `c-${Date.now()}`,
    name,
    phoneLast4: phoneLast4 || undefined,
    note: form.note.trim() || undefined,
    status: 'active',
    createdAt: new Date().toISOString()
  });
  saveCustomers();
  resetForm();
  isAdding.value = false;
  uni.showToast({ title: '已新增顾客', icon: 'success' });
}

onMounted(loadCustomers);
</script>

<template>
  <view class="page">
    <text class="title">顾客</text>
    <button v-if="!isAdding" type="button" @click="showAddForm">新增顾客</button>

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
        <text class="customer-name">{{ customer.name }}</text>
        <text class="customer-meta">{{ customer.phoneLast4 ? `尾号 ${customer.phoneLast4}` : '未填手机号' }}</text>
        <text v-if="customer.note" class="customer-meta">{{ customer.note }}</text>
      </view>
    </view>

    <text v-else class="empty">还没有顾客</text>
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
</style>
