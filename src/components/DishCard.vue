<template>
  <view class="dish-card" @click="handleCardClick">
    <!-- 菜品图片与售罄蒙层 -->
    <view class="dish-image-wrapper">
      <image
        class="dish-image"
        :src="dish.image || defaultImage"
        mode="aspectFill"
        lazy-load
      />
      <view v-if="isSoldOut" class="sold-out-mask">
        <text class="sold-out-text">已售罄</text>
      </view>
    </view>

    <!-- 菜品详细信息 -->
    <view class="dish-info">
      <view class="info-main">
        <!-- 标签栏 -->
        <view class="tag-row">
          <text v-for="tag in tags" :key="tag" class="dish-tag">{{ tag }}</text>
        </view>
        <!-- 菜品名 -->
        <text class="dish-name">{{ dish.name }}</text>
        <!-- 菜品描述 -->
        <text class="dish-desc">{{ dish.description }}</text>
      </view>

      <view class="info-footer">
        <text class="monthly-sales">月售{{ dish.monthlySales }}</text>
        <view class="price-action-row">
          <view class="price-box">
            <text class="currency">¥</text>
            <text class="price-value">{{ dish.price }}</text>
          </view>

          <!-- 操作按钮 -->
          <view class="action-box">
            <view v-if="isSoldOut" class="action-btn btn-sold-out">
              <text class="btn-text">已售罄</text>
            </view>
            <view
              v-else-if="hasMultipleSpecs"
              class="action-btn btn-spec"
              @click.stop="handleSpecClick"
            >
              <text class="btn-text">选规格</text>
            </view>
            <view
              v-else
              class="action-btn btn-add"
              @click.stop="handleQuickAdd"
            >
              <text class="plus-icon">+</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Dish } from '../types/dish';
import { addToCart } from '../store/cart';

interface Props {
  dish: Dish;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'click', dish: Dish): void;
  (e: 'add', dish: Dish): void;
}>();

const defaultImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

const isSoldOut = computed<boolean>(() => {
  return props.dish.status === 'sold_out';
});

const hasMultipleSpecs = computed<boolean>(() => {
  const portions = props.dish.portions || [];
  const toppings = props.dish.toppings || [];
  return portions.length > 1 || toppings.length > 0;
});

const tags = computed<string[]>(() => {
  const result: string[] = [];
  if (props.dish.category === '招牌') {
    result.push('招牌');
  } else if (props.dish.category) {
    result.push(props.dish.category);
  }
  result.push('现做');
  return result;
});

function handleCardClick(): void {
  emit('click', props.dish);
  uni.navigateTo({
    url: `/pages/detail/detail?id=${props.dish._id}`
  });
}

function handleSpecClick(): void {
  handleCardClick();
}

function handleQuickAdd(): void {
  if (isSoldOut.value) {
    return;
  }
  const defaultPortion =
    props.dish.portions?.find((p) => p.isDefault) ||
    props.dish.portions?.[0] || {
      name: '标准份',
      priceOffset: 0,
      isDefault: true
    };
  addToCart(props.dish, defaultPortion, []);
  emit('add', props.dish);
  uni.showToast({
    title: '已加入购物车',
    icon: 'none',
    duration: 1500
  });
}
</script>

<style scoped>
.dish-card {
  display: flex;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
  transition: opacity 0.2s ease;
}

.dish-card:active {
  opacity: 0.95;
}

.dish-image-wrapper {
  position: relative;
  width: 196rpx;
  height: 196rpx;
  border-radius: 16rpx;
  overflow: hidden;
  flex-shrink: 0;
  background-color: #f7f7f7;
}

.dish-image {
  width: 100%;
  height: 100%;
}

.sold-out-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sold-out-text {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.4);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}

.dish-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.info-main {
  display: flex;
  flex-direction: column;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.dish-tag {
  font-size: 20rpx;
  color: #ff5722;
  background-color: #fff3e0;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  font-weight: 500;
}

.dish-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #222222;
  line-height: 1.35;
}

.dish-desc {
  font-size: 22rpx;
  color: #888888;
  line-height: 1.4;
  margin-top: 6rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.info-footer {
  margin-top: 12rpx;
}

.monthly-sales {
  font-size: 22rpx;
  color: #999999;
}

.price-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6rpx;
}

.price-box {
  display: flex;
  align-items: baseline;
}

.currency {
  font-size: 24rpx;
  font-weight: 600;
  color: #ff5722;
}

.price-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #ff5722;
  margin-left: 2rpx;
}

.action-box {
  display: flex;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-spec {
  background: linear-gradient(135deg, #ff7043, #ff5722);
  color: #ffffff;
  padding: 8rpx 22rpx;
  border-radius: 28rpx;
  box-shadow: 0 4rpx 10rpx rgba(255, 87, 34, 0.25);
}

.btn-spec .btn-text {
  font-size: 24rpx;
  font-weight: 500;
  color: #ffffff;
}

.btn-add {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff7043, #ff5722);
  color: #ffffff;
  box-shadow: 0 4rpx 10rpx rgba(255, 87, 34, 0.25);
}

.btn-add .plus-icon {
  font-size: 34rpx;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
  margin-top: -2rpx;
}

.btn-sold-out {
  background-color: #ebebeb;
  padding: 6rpx 18rpx;
  border-radius: 24rpx;
}

.btn-sold-out .btn-text {
  font-size: 22rpx;
  color: #9e9e9e;
}
</style>
