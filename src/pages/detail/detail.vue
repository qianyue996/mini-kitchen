<template>
  <view class="detail-container">
    <text class="page-title">{{ title }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const title = ref<string>('菜品详情')
</script>

<style scoped>
.detail-container {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-title {
  font-size: 36rpx;
  color: #333333;
}
</style>
