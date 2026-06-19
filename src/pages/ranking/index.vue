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
  border-radius: var(--radius);
}
.empty {
  color: var(--color-muted);
}
</style>
