<template>
  <view class="cart-page">
    <!-- 顶部标题栏与管理入口 -->
    <view class="cart-header">
      <view class="header-content">
        <text class="header-title">购物车</text>
        <view v-if="!cartStore.isEmpty.value" class="manage-btn" @click="toggleManageMode">
          <text class="manage-btn-text">{{ isManageMode ? '完成' : '管理' }}</text>
        </view>
      </view>
    </view>

    <!-- 空购物车状态 -->
    <view v-if="cartStore.isEmpty.value" class="empty-state">
      <view class="empty-icon-wrap">
        <text class="empty-emoji">🛒</text>
      </view>
      <text class="empty-title">购物车还是空的，去选几道美味吧</text>
      <text class="empty-subtitle">今日现做热炒与便当，一人食刚刚好</text>
      <button class="go-menu-btn" @click="handleGoToMenu">去点餐</button>
    </view>

    <!-- 购物车商品列表及主内容 -->
    <view v-else class="cart-content">
      <!-- 批量操作提示栏 (管理模式下显示) -->
      <view v-if="isManageMode" class="batch-bar">
        <text class="batch-info">已选择商品可快捷清空</text>
        <view class="batch-clear-btn" @click="handlePromptClearCart">
          <text class="batch-clear-text">清空购物车</text>
        </view>
      </view>

      <!-- 商品列表卡片 -->
      <view class="cart-items-card">
        <view
          v-for="item in cartStore.items.value"
          :key="item.specKey"
          class="cart-item-row"
        >
          <!-- 菜品图片 -->
          <image
            class="item-image"
            :src="item.image || defaultDishImage"
            mode="aspectFill"
            @click="handleViewDish(item.dishId)"
          />

          <!-- 菜品详情与规格 -->
          <view class="item-detail">
            <view class="item-title-row">
              <text class="item-name" @click="handleViewDish(item.dishId)">{{ item.name }}</text>
              <text
                v-if="isManageMode"
                class="item-delete-icon"
                @click="handleRemoveItem(item.specKey, item.name)"
              >
                ✕
              </text>
            </view>

            <!-- 规格概要：份量 · 加料 -->
            <view class="item-spec-box">
              <text class="item-spec-text">{{ formatSpecSummary(item) }}</text>
            </view>

            <!-- 单价与数量步进器 -->
            <view class="item-action-row">
              <view class="price-wrap">
                <text class="currency">¥</text>
                <text class="price-val">{{ item.unitPrice }}</text>
              </view>

              <view class="stepper-wrap">
                <view
                  class="stepper-btn minus"
                  :class="{ danger: item.quantity === 1 }"
                  @click="handleMinus(item)"
                >
                  <text class="stepper-icon">{{ item.quantity === 1 ? '🗑' : '−' }}</text>
                </view>
                <text class="stepper-count">{{ item.quantity }}</text>
                <view class="stepper-btn plus" @click="handlePlus(item)">
                  <text class="stepper-icon">+</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 整单备注框 -->
      <view class="remark-card">
        <view class="remark-header">
          <text class="remark-icon">📝</text>
          <text class="remark-label">整单备注</text>
        </view>
        <textarea
          class="remark-textarea"
          :value="cartStore.remark.value"
          placeholder="口味、忌口、配送时间备注（例如：少辣、不要葱）"
          placeholder-class="remark-placeholder"
          :maxlength="100"
          @input="handleRemarkInput"
        />
        <view class="remark-counter">
          <text class="counter-text">{{ cartStore.remark.value.length }}/100</text>
        </view>
      </view>

      <!-- 配送与小贴士提示 -->
      <view class="tips-box">
        <text class="tips-item">• 现做热菜，预计下单后 25-35 分钟送达</text>
        <text class="tips-item">• 如有特殊忌口，请在上方备注中说明</text>
      </view>
    </view>

    <!-- 底部固定结算条 (购物车非空时显示) -->
    <view v-if="!cartStore.isEmpty.value" class="bottom-checkout-bar">
      <view class="checkout-summary">
        <text class="summary-label">合计</text>
        <text class="summary-currency">¥</text>
        <text class="summary-amount">{{ cartStore.totalAmount.value }}</text>
        <text class="summary-count">共 {{ cartStore.totalCount.value }} 份</text>
      </view>
      <button
        class="checkout-submit-btn"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        @click="handleCheckout"
      >
        去结算
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCartStore } from '../../store/cart';
import { cloudAdapter } from '../../services/cloud-adapter';
import type { CartItem } from '../../types/order';

const cartStore = useCartStore();

// 默认占位图片
const defaultDishImage = '/static/logo.png';

// 管理模式开关
const isManageMode = ref<boolean>(false);
const isSubmitting = ref<boolean>(false);

function toggleManageMode(): void {
  isManageMode.value = !isManageMode.value;
}

// 格式化规格摘要行
function formatSpecSummary(item: CartItem): string {
  const parts: string[] = [];
  if (item.portion) {
    parts.push(item.portion);
  }
  if (item.toppings && item.toppings.length > 0) {
    parts.push(item.toppings.join(' · '));
  }
  return parts.length > 0 ? parts.join(' · ') : '标准配置';
}

// 步进器增加
function handlePlus(item: CartItem): void {
  cartStore.updateQuantity(item.specKey, 1);
}

// 步进器减少：数量为1时弹窗确认移除或直接减少
function handleMinus(item: CartItem): void {
  if (item.quantity === 1) {
    uni.showModal({
      title: '移除商品',
      content: `确定从购物车中移除“${item.name}”吗？`,
      confirmColor: '#FF5722',
      success: (res) => {
        if (res.confirm) {
          cartStore.updateQuantity(item.specKey, -1);
        }
      }
    });
  } else {
    cartStore.updateQuantity(item.specKey, -1);
  }
}

// 管理模式下单独删除
function handleRemoveItem(specKey: string, itemName: string): void {
  uni.showModal({
    title: '删除商品',
    content: `确定删除“${itemName}”吗？`,
    confirmColor: '#FF5722',
    success: (res) => {
      if (res.confirm) {
        cartStore.removeFromCart(specKey);
      }
    }
  });
}

// 清空购物车
function handlePromptClearCart(): void {
  uni.showModal({
    title: '清空购物车',
    content: '确定要清空购物车里的全部商品吗？',
    confirmColor: '#FF5722',
    success: (res) => {
      if (res.confirm) {
        cartStore.clearCart();
        isManageMode.value = false;
        uni.showToast({
          title: '已清空购物车',
          icon: 'none'
        });
      }
    }
  });
}

// 备注输入绑定
function handleRemarkInput(e: { detail: { value: string } }): void {
  cartStore.setRemark(e.detail.value);
}

// 跳转菜单点餐
function handleGoToMenu(): void {
  uni.switchTab({
    url: '/pages/index/index'
  });
}

// 查看菜品详情
function handleViewDish(dishId: string): void {
  if (!dishId) return;
  uni.navigateTo({
    url: `/pages/detail/detail?id=${dishId}`
  });
}

// 立即去结算
async function handleCheckout(): Promise<void> {
  if (cartStore.isEmpty.value) {
    uni.showToast({
      title: '购物车为空',
      icon: 'none'
    });
    return;
  }

  uni.showModal({
    title: '确认提交订单',
    content: `共 ${cartStore.totalCount.value} 件商品，合计 ¥${cartStore.totalAmount.value}，确认下单吗？`,
    confirmText: '确认下单',
    confirmColor: '#FF5722',
    cancelText: '再看看',
    success: async (res) => {
      if (res.confirm) {
        await submitOrder();
      }
    }
  });
}

// 下单逻辑
async function submitOrder(): Promise<void> {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  uni.showLoading({ title: '提交订单中...' });

  try {
    const orderItems = [...cartStore.items.value];
    const totalAmount = cartStore.totalAmount.value;
    const remark = cartStore.remark.value;

    const newOrder = await cloudAdapter.createOrder({
      items: orderItems,
      totalAmount,
      remark,
      status: 'cooking'
    });

    uni.hideLoading();

    if (newOrder && newOrder._id) {
      // 清空购物车
      cartStore.clearCart();
      isManageMode.value = false;

      uni.showToast({
        title: '下单成功！',
        icon: 'success',
        duration: 1500
      });

      // 延迟跳转至订单页面
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/order/order'
        });
      }, 800);
    } else {
      uni.showToast({
        title: '下单失败，请重试',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    uni.showToast({
      title: '网络异常，下单失败',
      icon: 'none'
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.cart-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 220rpx;
  box-sizing: border-box;
}

/* 头部导航与操作 */
.cart-header {
  background-color: #ffffff;
  padding: 24rpx 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
  position: sticky;
  top: 0;
  z-index: 20;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #1a1a1a;
}

.manage-btn {
  padding: 8rpx 16rpx;
}

.manage-btn-text {
  font-size: 28rpx;
  color: #666666;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 48rpx;
}

.empty-icon-wrap {
  width: 140rpx;
  height: 140rpx;
  background: #fff0eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.empty-emoji {
  font-size: 64rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 12rpx;
  text-align: center;
}

.empty-subtitle {
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 48rpx;
  text-align: center;
}

.go-menu-btn {
  background: linear-gradient(135deg, #ff6b3d 0%, #ff5722 100%);
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 600;
  border-radius: 44rpx;
  padding: 0 64rpx;
  height: 84rpx;
  line-height: 84rpx;
  box-shadow: 0 8rpx 20rpx rgba(255, 87, 34, 0.3);
  border: none;
}

/* 购物车主内容 */
.cart-content {
  padding: 24rpx 24rpx 40rpx;
}

/* 批量操作提示栏 */
.batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff5f0;
  border: 1rpx solid #ffe3d6;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  margin-bottom: 20rpx;
}

.batch-info {
  font-size: 26rpx;
  color: #888888;
}

.batch-clear-btn {
  padding: 6rpx 16rpx;
  background: #ff5722;
  border-radius: 20rpx;
}

.batch-clear-text {
  font-size: 24rpx;
  color: #ffffff;
  font-weight: 500;
}

/* 商品卡片容器 */
.cart-items-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 12rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  margin-bottom: 24rpx;
}

.cart-item-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f2f3f5;
}

.cart-item-row:last-child {
  border-bottom: none;
}

.item-image {
  width: 150rpx;
  height: 150rpx;
  border-radius: 16rpx;
  background-color: #f0f0f0;
  flex-shrink: 0;
  margin-right: 20rpx;
}

.item-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 150rpx;
  min-width: 0;
}

.item-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #222222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.item-delete-icon {
  font-size: 28rpx;
  color: #ff4d4f;
  padding: 4rpx 12rpx;
  font-weight: bold;
}

.item-spec-box {
  margin-top: 6rpx;
}

.item-spec-text {
  font-size: 24rpx;
  color: #888888;
  background-color: #f7f7f8;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-action-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.price-wrap {
  display: flex;
  align-items: baseline;
}

.currency {
  font-size: 24rpx;
  color: #ff5722;
  font-weight: bold;
}

.price-val {
  font-size: 34rpx;
  color: #ff5722;
  font-weight: 700;
  margin-left: 2rpx;
}

/* 步进器 */
.stepper-wrap {
  display: flex;
  align-items: center;
  background-color: #f6f7f9;
  border-radius: 28rpx;
  padding: 4rpx;
}

.stepper-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background-color: #ffffff;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.06);
}

.stepper-btn.danger {
  background-color: #fff1f0;
}

.stepper-icon {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  line-height: 1;
}

.stepper-btn.danger .stepper-icon {
  font-size: 22rpx;
}

.stepper-count {
  font-size: 26rpx;
  font-weight: 600;
  color: #222222;
  min-width: 52rpx;
  text-align: center;
}

/* 备注卡片 */
.remark-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  margin-bottom: 24rpx;
}

.remark-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.remark-icon {
  font-size: 30rpx;
  margin-right: 10rpx;
}

.remark-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.remark-textarea {
  width: 100%;
  height: 140rpx;
  background-color: #f9f9fb;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  font-size: 26rpx;
  color: #333333;
  box-sizing: border-box;
}

.remark-placeholder {
  color: #bbbbbb;
  font-size: 26rpx;
}

.remark-counter {
  display: flex;
  justify-content: flex-end;
  margin-top: 8rpx;
}

.counter-text {
  font-size: 22rpx;
  color: #aaaaaa;
}

/* 配送贴士 */
.tips-box {
  padding: 12rpx 16rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.tips-item {
  font-size: 22rpx;
  color: #999999;
}

/* 底部固定结算栏 */
.bottom-checkout-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ffffff;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 50;
}

.checkout-summary {
  display: flex;
  align-items: baseline;
}

.summary-label {
  font-size: 26rpx;
  color: #555555;
  margin-right: 8rpx;
}

.summary-currency {
  font-size: 28rpx;
  color: #ff5722;
  font-weight: bold;
}

.summary-amount {
  font-size: 44rpx;
  color: #ff5722;
  font-weight: 800;
  margin-right: 16rpx;
}

.summary-count {
  font-size: 22rpx;
  color: #999999;
}

.checkout-submit-btn {
  background: linear-gradient(135deg, #ff6b3d 0%, #ff5722 100%);
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 700;
  border-radius: 44rpx;
  padding: 0 48rpx;
  height: 80rpx;
  line-height: 80rpx;
  box-shadow: 0 6rpx 16rpx rgba(255, 87, 34, 0.35);
  border: none;
  margin: 0;
}

.checkout-submit-btn:disabled {
  opacity: 0.6;
}
</style>
