<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import type { AppDataState } from '@/services/appData';
import { createAppDataStore, markBackupComplete } from '@/services/appData';
import { createBackupSnapshot } from '@/services/backup';

const store = createAppDataStore();
const state = ref<AppDataState>(store.load());
const exportText = ref('');

const backupLabel = computed(() => {
  return state.value.lastBackupAt ? state.value.lastBackupAt.slice(0, 16).replace('T', ' ') : '还没有备份';
});

function refresh() {
  state.value = store.load();
}

function backupData() {
  const now = new Date().toISOString();
  markBackupComplete(store, now);
  refresh();
  uni.showToast({ title: '已记录备份时间', icon: 'success' });
}

function exportData() {
  const now = new Date().toISOString();
  exportText.value = JSON.stringify(createBackupSnapshot(store.load(), now), null, 2);
  uni.setClipboardData({
    data: exportText.value,
    success() {
      uni.showToast({ title: '导出内容已复制', icon: 'success' });
    }
  });
}

onShow(refresh);
</script>

<template>
  <view class="page">
    <text class="title">设置</text>
    <text class="backup-status">最近备份：{{ backupLabel }}</text>
    <button type="button" @click="backupData">备份数据</button>
    <button type="button" @click="exportData">导出数据</button>
    <button type="button">字号设置</button>
    <textarea v-if="exportText" v-model="exportText" class="export-box" />
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
  border-radius: var(--radius);
  font-size: var(--font-body);
}
.export-box {
  width: 100%;
  min-height: 220px;
  padding: var(--space-4);
  border: 1px solid #d0d5dd;
  border-radius: var(--radius);
  background: var(--color-surface);
  font-size: 14px;
}
</style>
