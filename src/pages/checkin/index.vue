<template>
  <view class="page">
    <button class="voice-button" type="button">语音签到</button>
    <view class="quick-actions">
      <button type="button">选择名字</button>
      <button type="button">手写名字</button>
    </view>
    <view class="section">
      <text class="section-title">今日签到</text>
      <text class="empty">暂无签到记录</text>
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
.section-title {
  display: block;
  font-size: var(--font-title);
  font-weight: 700;
}
.section {
  width: calc(100vw - 40px);
  margin: 0 var(--space-5);
}
.empty {
  display: block;
  margin-top: var(--space-3);
  color: var(--color-muted);
}

@media (min-width: 640px) {
  .quick-actions {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
</style>
