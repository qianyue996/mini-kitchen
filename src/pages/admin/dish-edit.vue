<template>
  <view class="dish-edit-container">
    <text class="page-title">{{ title }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const title = ref<string>('编辑菜品')
</script>

<style scoped>
.dish-edit-container {
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
