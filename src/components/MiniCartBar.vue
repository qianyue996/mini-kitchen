<template>
  <view v-if="totalCount > 0" class="mini-cart-bar" @click="handleToCart">
    <!-- 左侧购物车信息 -->
    <view class="cart-summary">
      <view class="cart-icon-wrapper">
        <view class="cart-icon">🛒</view>
        <view class="badge">{{ totalCount }}</view>
      </view>
      <view class="cart-text-info">
        <text class="count-desc">已选 {{ totalCount }} 件</text>
        <view class="amount-row">
          <text class="amount-label">合计</text>
          <text class="amount-currency">¥</text>
          <text class="amount-value">{{ totalAmount }}</text>
        </view>
      </view>
    </view>

    <!-- 右侧去结算按钮 -->
    <view class="checkout-btn" @click.stop="handleToCart">
      <text class="btn-text">去结算</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useCartStore } from '../store/cart';

const { totalCount, totalAmount } = useCartStore();

function handleToCart(): void {
  uni.switchTab({
    url: '/pages/cart/cart'
  });
}
</script>

<style scoped>
.mini-cart-bar {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom));
  height: 100rpx;
  background-color: #242424;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16rpx 0 28rpx;
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.22);
  z-index: 99;
  box-sizing: border-box;
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(120rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.cart-summary {
  display: flex;
  align-items: center;
}

.cart-icon-wrapper {
  position: relative;
  width: 68rpx;
  height: 68rpx;
  background: #383838;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.cart-icon {
  font-size: 32rpx;
  line-height: 1;
}

.badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  background-color: #ff5722;
  color: #ffffff;
  font-size: 20rpx;
  font-weight: 700;
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  text-align: center;
  border-radius: 16rpx;
  padding: 0 8rpx;
  box-sizing: border-box;
  border: 2rpx solid #242424;
}

.cart-text-info {
  display: flex;
  flex-direction: column;
}

.count-desc {
  font-size: 20rpx;
  color: #aaaaaa;
}

.amount-row {
  display: flex;
  align-items: baseline;
}

.amount-label {
  font-size: 22rpx;
  color: #dddddd;
  margin-right: 6rpx;
}

.amount-currency {
  font-size: 24rpx;
  font-weight: 600;
  color: #ffffff;
}

.amount-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  margin-left: 2rpx;
}

.checkout-btn {
  background: linear-gradient(135deg, #ff7043, #ff5722);
  height: 72rpx;
  padding: 0 36rpx;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(255, 87, 34, 0.35);
}

.checkout-btn:active {
  opacity: 0.9;
}

.btn-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #ffffff;
}
</style>
