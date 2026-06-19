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
  border-radius: var(--radius);
}
.empty {
  color: var(--color-muted);
}
</style>
