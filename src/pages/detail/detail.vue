<template>
  <view class="detail-container">
    <!-- 顶部悬浮导航按钮 -->
    <view class="floating-nav-bar">
      <view class="nav-btn" @click="handleBack">
        <text class="nav-back-icon">‹</text>
      </view>
      <view class="nav-btn" @click="handleGoToCart">
        <text class="nav-cart-icon">🛒</text>
        <view v-if="totalCount > 0" class="nav-badge">
          {{ totalCount > 99 ? '99+' : totalCount }}
        </view>
      </view>
    </view>

    <!-- 加载中状态 -->
    <view v-if="loading" class="state-container">
      <text class="state-text">美味加载中...</text>
    </view>

    <!-- 菜品不存在兜底 -->
    <view v-else-if="!dish" class="state-container">
      <text class="state-icon">🍽️</text>
      <text class="state-text">未找到相关菜品</text>
      <view class="back-home-btn" @click="handleBack">
        <text class="back-home-text">返回主页</text>
      </view>
    </view>

    <!-- 菜品内容区 -->
    <view v-else class="content-scroll">
      <!-- 菜品头图 -->
      <view class="hero-image-wrapper">
        <image
          class="hero-image"
          :src="dish.image || defaultImage"
          mode="aspectFill"
        />
        <view v-if="isSoldOut" class="sold-out-overlay">
          <text class="sold-out-badge">已售罄</text>
        </view>
      </view>

      <!-- 菜品核心信息卡片 -->
      <view class="card-section dish-main-card">
        <!-- 标签行 -->
        <view class="tags-row">
          <text class="dish-tag">招牌</text>
          <text class="dish-tag">现做</text>
          <text v-if="dish.category && dish.category !== '招牌'" class="dish-tag category-tag">
            {{ dish.category }}
          </text>
        </view>

        <!-- 菜品名称与基础价格 -->
        <view class="name-price-row">
          <text class="dish-name">{{ dish.name }}</text>
          <view class="price-box">
            <text class="currency">¥</text>
            <text class="price-num">{{ dish.price }}</text>
          </view>
        </view>

        <!-- 评分与月售数据 -->
        <view class="stats-row">
          <view class="rating-box">
            <text class="star-icon">★</text>
            <text class="rating-text">{{ dish.rating.toFixed(1) }}分</text>
          </view>
          <text class="sales-text">月售{{ dish.monthlySales }}</text>
        </view>

        <!-- 菜品描述 -->
        <view class="desc-box">
          <text class="desc-text">{{ dish.description }}</text>
        </view>
      </view>

      <!-- 规格选项1: 选择份量 (单选) -->
      <view class="card-section spec-section">
        <view class="section-header">
          <text class="section-title">选择份量</text>
          <text class="section-tip">单选</text>
        </view>
        <view class="portion-grid">
          <view
            v-for="portion in availablePortions"
            :key="portion.name"
            class="portion-pill"
            :class="{ active: selectedPortion?.name === portion.name }"
            @click="selectPortion(portion)"
          >
            <view class="radio-circle">
              <view v-if="selectedPortion?.name === portion.name" class="radio-dot" />
            </view>
            <text class="portion-name">{{ portion.name }}</text>
            <text class="portion-offset">
              {{ formatPortionOffset(portion.priceOffset) }}
            </text>
          </view>
        </view>
      </view>

      <!-- 规格选项2: 配料加料 (多选) -->
      <view class="card-section spec-section">
        <view class="section-header">
          <text class="section-title">配料</text>
          <text class="section-tip">可多选</text>
        </view>
        <view class="toppings-grid">
          <view
            v-for="topping in availableToppings"
            :key="topping.name"
            class="topping-pill"
            :class="{ active: isToppingSelected(topping) }"
            @click="toggleTopping(topping)"
          >
            <view class="checkbox-box">
              <text v-if="isToppingSelected(topping)" class="checkmark">✓</text>
            </view>
            <text class="topping-name">{{ topping.name }}</text>
            <text class="topping-price">+¥{{ topping.price }}</text>
          </view>
        </view>
      </view>

      <!-- 购买数量步进器 -->
      <view class="card-section quantity-section">
        <text class="section-title">购买数量</text>
        <view class="stepper">
          <view
            class="stepper-btn"
            :class="{ disabled: quantity <= 1 || isSoldOut }"
            @click="decrementQuantity"
          >
            <text class="stepper-sign">-</text>
          </view>
          <text class="stepper-value">{{ quantity }}</text>
          <view
            class="stepper-btn"
            :class="{ disabled: quantity >= 99 || isSoldOut }"
            @click="incrementQuantity"
          >
            <text class="stepper-sign">+</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部固定操作栏 -->
    <view v-if="dish" class="bottom-action-bar">
      <!-- 左侧: 购物车入口与动态金额明细 -->
      <view class="bottom-left">
        <view class="cart-trigger" @click="handleGoToCart">
          <text class="cart-icon">🛒</text>
          <view v-if="totalCount > 0" class="cart-badge">
            {{ totalCount > 99 ? '99+' : totalCount }}
          </view>
        </view>
        <view class="price-summary">
          <view class="subtotal-row">
            <text class="subtotal-currency">¥</text>
            <text class="subtotal-amount">{{ totalPrice }}</text>
          </view>
          <text class="unit-breakdown">单价 ¥{{ unitPrice }}</text>
        </view>
      </view>

      <!-- 右侧: 操作按钮组 -->
      <view class="bottom-right">
        <view
          class="btn-action btn-add-cart"
          :class="{ disabled: isSoldOut }"
          @click="handleAddToCart"
        >
          <text class="btn-text">加入购物车</text>
        </view>
        <view
          class="btn-action btn-checkout"
          :class="{ disabled: isSoldOut }"
          @click="handleCheckout"
        >
          <text class="btn-text">立即结算</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import type { Dish, DishPortion, DishTopping } from '../../types/dish';
import { cloudAdapter } from '../../services/cloud-adapter';
import { useCartStore } from '../../store/cart';
import { defaultPortions, defaultToppings } from '../../services/mock-data';

const defaultImage =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

const dish = ref<Dish | null>(null);
const loading = ref<boolean>(true);
const selectedPortion = ref<DishPortion | null>(null);
const selectedToppings = ref<DishTopping[]>([]);
const quantity = ref<number>(1);

const { totalCount, addToCart } = useCartStore();

const isSoldOut = computed<boolean>(() => {
  return dish.value?.status === 'sold_out';
});

const availablePortions = computed<DishPortion[]>(() => {
  if (dish.value?.portions && dish.value.portions.length > 0) {
    return dish.value.portions;
  }
  return defaultPortions;
});

const availableToppings = computed<DishTopping[]>(() => {
  if (dish.value?.toppings && dish.value.toppings.length > 0) {
    return dish.value.toppings;
  }
  return defaultToppings;
});

const unitPrice = computed<number>(() => {
  if (!dish.value) {
    return 0;
  }
  const basePrice = dish.value.price;
  const portionOffset = selectedPortion.value ? selectedPortion.value.priceOffset : 0;
  const toppingsTotal = selectedToppings.value.reduce((acc, t) => acc + t.price, 0);
  return Math.round((basePrice + portionOffset + toppingsTotal) * 100) / 100;
});

const totalPrice = computed<number>(() => {
  return Math.round(unitPrice.value * quantity.value * 100) / 100;
});

function initSelections(targetDish: Dish): void {
  const portions =
    targetDish.portions && targetDish.portions.length > 0
      ? targetDish.portions
      : defaultPortions;
  const defPortion = portions.find((p) => p.isDefault) || portions[0];
  selectedPortion.value = defPortion;
  selectedToppings.value = [];
  quantity.value = 1;
}

async function loadDish(id?: string): Promise<void> {
  loading.value = true;
  try {
    let result: Dish | null = null;
    if (id) {
      result = await cloudAdapter.getDishDetail(id);
    }
    if (!result) {
      const allDishes = await cloudAdapter.getDishes();
      if (allDishes.length > 0) {
        result = allDishes[0];
      }
    }
    if (result) {
      dish.value = result;
      initSelections(result);
    } else {
      dish.value = null;
    }
  } catch (err) {
    console.error('加载菜品详情失败:', err);
    dish.value = null;
  } finally {
    loading.value = false;
  }
}

onLoad(async (query) => {
  const queryObj = query as Record<string, string | undefined> | undefined;
  const targetId = queryObj?.id;
  await loadDish(targetId);
});

function selectPortion(portion: DishPortion): void {
  selectedPortion.value = portion;
}

function toggleTopping(topping: DishTopping): void {
  const index = selectedToppings.value.findIndex((t) => t.name === topping.name);
  if (index >= 0) {
    selectedToppings.value.splice(index, 1);
  } else {
    selectedToppings.value.push(topping);
  }
}

function isToppingSelected(topping: DishTopping): boolean {
  return selectedToppings.value.some((t) => t.name === topping.name);
}

function formatPortionOffset(offset: number): string {
  if (offset === 0) {
    return '(+¥0 / 默认)';
  }
  if (offset > 0) {
    return `(+¥${offset})`;
  }
  return `(-¥${Math.abs(offset)})`;
}

function decrementQuantity(): void {
  if (quantity.value > 1) {
    quantity.value -= 1;
  }
}

function incrementQuantity(): void {
  if (quantity.value < 99) {
    quantity.value += 1;
  }
}

function handleBack(): void {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({
      url: '/pages/index/index'
    });
  }
}

function handleGoToCart(): void {
  uni.switchTab({
    url: '/pages/cart/cart'
  });
}

function handleAddToCart(): void {
  if (!dish.value || !selectedPortion.value || isSoldOut.value) {
    return;
  }
  addToCart(dish.value, selectedPortion.value, selectedToppings.value, quantity.value);
  uni.showToast({
    title: '已加入购物车',
    icon: 'success',
    duration: 1500
  });
}

function handleCheckout(): void {
  if (!dish.value || !selectedPortion.value || isSoldOut.value) {
    return;
  }
  addToCart(dish.value, selectedPortion.value, selectedToppings.value, quantity.value);
  uni.switchTab({
    url: '/pages/cart/cart'
  });
}
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  position: relative;
}

/* 顶部悬浮导航 */
.floating-nav-bar {
  position: fixed;
  top: calc(20rpx + env(safe-area-inset-top));
  left: 24rpx;
  right: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  pointer-events: none;
}

.nav-btn {
  pointer-events: auto;
  width: 72rpx;
  height: 72rpx;
  background-color: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(8px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
  position: relative;
}

.nav-btn:active {
  transform: scale(0.94);
}

.nav-back-icon {
  font-size: 52rpx;
  color: #222222;
  line-height: 1;
  margin-top: -6rpx;
  margin-left: -2rpx;
}

.nav-cart-icon {
  font-size: 34rpx;
  line-height: 1;
}

.nav-badge {
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
  border: 2rpx solid #ffffff;
}

/* 状态展示 */
.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 240rpx 40rpx 0;
}

.state-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.state-text {
  font-size: 28rpx;
  color: #888888;
}

.back-home-btn {
  margin-top: 36rpx;
  background-color: #ff5722;
  padding: 16rpx 48rpx;
  border-radius: 36rpx;
}

.back-home-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 500;
}

/* 菜品大图 */
.hero-image-wrapper {
  position: relative;
  width: 100%;
  height: 520rpx;
  background-color: #eaeaea;
  overflow: hidden;
  border-bottom-left-radius: 28rpx;
  border-bottom-right-radius: 28rpx;
}

.hero-image {
  width: 100%;
  height: 100%;
}

.sold-out-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sold-out-badge {
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 700;
  padding: 12rpx 36rpx;
  border-radius: 30rpx;
}

/* 卡片通用样式 */
.card-section {
  background-color: #ffffff;
  border-radius: 24rpx;
  margin: 20rpx 24rpx 0;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
}

/* 菜品核心信息 */
.dish-main-card {
  margin-top: -24rpx;
  position: relative;
  z-index: 10;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.dish-tag {
  font-size: 22rpx;
  font-weight: 600;
  color: #ff5722;
  background-color: #fff3e0;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
}

.category-tag {
  color: #ff9800;
  background-color: #fff8e1;
}

.name-price-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12rpx;
}

.dish-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #222222;
  flex: 1;
  margin-right: 20rpx;
  line-height: 1.35;
}

.price-box {
  display: flex;
  align-items: baseline;
}

.currency {
  font-size: 26rpx;
  font-weight: 700;
  color: #ff5722;
}

.price-num {
  font-size: 44rpx;
  font-weight: 800;
  color: #ff5722;
  margin-left: 2rpx;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 16rpx;
}

.rating-box {
  display: flex;
  align-items: center;
  background-color: #fff9e6;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.star-icon {
  color: #ffb300;
  font-size: 24rpx;
  margin-right: 4rpx;
}

.rating-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #e65100;
}

.sales-text {
  font-size: 24rpx;
  color: #888888;
}

.desc-box {
  margin-top: 10rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.desc-text {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.55;
}

/* 规格分区 */
.section-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #222222;
}

.section-tip {
  font-size: 22rpx;
  color: #999999;
  margin-left: 12rpx;
}

/* 份量单选网格 */
.portion-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.portion-pill {
  flex: 1;
  min-width: 240rpx;
  background-color: #f8f9fa;
  border: 2rpx solid #ebebeb;
  border-radius: 18rpx;
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.portion-pill.active {
  background-color: #fff5f0;
  border-color: #ff5722;
}

.radio-circle {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 2rpx solid #cccccc;
  margin-right: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.portion-pill.active .radio-circle {
  border-color: #ff5722;
}

.radio-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background-color: #ff5722;
}

.portion-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.portion-pill.active .portion-name {
  color: #ff5722;
}

.portion-offset {
  font-size: 24rpx;
  color: #888888;
  margin-left: 10rpx;
}

.portion-pill.active .portion-offset {
  color: #ff7043;
}

/* 配料多选网格 */
.toppings-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.topping-pill {
  width: calc(50% - 9rpx);
  background-color: #f8f9fa;
  border: 2rpx solid #ebebeb;
  border-radius: 18rpx;
  padding: 20rpx 20rpx;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.topping-pill.active {
  background-color: #fff5f0;
  border-color: #ff5722;
}

.checkbox-box {
  width: 32rpx;
  height: 32rpx;
  border-radius: 8rpx;
  border: 2rpx solid #cccccc;
  margin-right: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.topping-pill.active .checkbox-box {
  background-color: #ff5722;
  border-color: #ff5722;
}

.checkmark {
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1;
}

.topping-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #333333;
  flex: 1;
}

.topping-pill.active .topping-name {
  color: #ff5722;
  font-weight: 600;
}

.topping-price {
  font-size: 26rpx;
  color: #888888;
  font-weight: 600;
}

.topping-pill.active .topping-price {
  color: #ff5722;
}

/* 购买数量 */
.quantity-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.stepper {
  display: flex;
  align-items: center;
}

.stepper-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 12rpx;
  background-color: #f2f3f5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.stepper-btn:active {
  opacity: 0.7;
}

.stepper-btn.disabled {
  opacity: 0.35;
  pointer-events: none;
}

.stepper-sign {
  font-size: 34rpx;
  font-weight: 600;
  color: #333333;
  line-height: 1;
}

.stepper-value {
  font-size: 30rpx;
  font-weight: 700;
  color: #222222;
  min-width: 68rpx;
  text-align: center;
}

/* 底部操作栏 */
.bottom-action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ffffff;
  border-top: 1rpx solid #eeeeee;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 28rpx calc(16rpx + env(safe-area-inset-bottom));
  z-index: 99;
  box-sizing: border-box;
}

.bottom-left {
  display: flex;
  align-items: center;
}

.cart-trigger {
  position: relative;
  width: 76rpx;
  height: 76rpx;
  background-color: #f7f7f7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  border: 1rpx solid #e8e8e8;
}

.cart-trigger:active {
  transform: scale(0.95);
}

.cart-icon {
  font-size: 38rpx;
  line-height: 1;
}

.cart-badge {
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
  border: 2rpx solid #ffffff;
}

.price-summary {
  display: flex;
  flex-direction: column;
}

.subtotal-row {
  display: flex;
  align-items: baseline;
}

.subtotal-currency {
  font-size: 26rpx;
  font-weight: 700;
  color: #ff5722;
}

.subtotal-amount {
  font-size: 40rpx;
  font-weight: 800;
  color: #ff5722;
  margin-left: 2rpx;
}

.unit-breakdown {
  font-size: 20rpx;
  color: #999999;
}

.bottom-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.btn-action {
  height: 76rpx;
  padding: 0 32rpx;
  border-radius: 38rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: opacity 0.2s;
}

.btn-action:active {
  opacity: 0.88;
}

.btn-action.disabled {
  opacity: 0.45;
  pointer-events: none;
}

.btn-add-cart {
  background-color: #fff3e0;
  border: 2rpx solid #ffccbc;
}

.btn-add-cart .btn-text {
  font-size: 26rpx;
  font-weight: 600;
  color: #ff5722;
}

.btn-checkout {
  background: linear-gradient(135deg, #ff7043, #ff5722);
  box-shadow: 0 4rpx 14rpx rgba(255, 87, 34, 0.35);
}

.btn-checkout .btn-text {
  font-size: 26rpx;
  font-weight: 600;
  color: #ffffff;
}
</style>
