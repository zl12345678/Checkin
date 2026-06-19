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
  border-radius: var(--radius);
}
</style>
