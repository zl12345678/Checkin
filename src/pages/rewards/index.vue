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
  border-radius: var(--radius);
}
.empty {
  color: var(--color-muted);
}
</style>
