<template>
  <view class="home-container">
    <!-- 头部品牌展示与管理入口 -->
    <view class="header-section">
      <view class="brand-info">
        <text class="brand-title">迷你小厨房</text>
        <text class="brand-subtitle">今日现做 | 新鲜小份，一人刚好</text>
      </view>
      <view class="admin-link-btn" @click="goToAdmin">
        <text class="admin-link-text">管理</text>
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          v-model="searchKeyword"
          class="search-input"
          type="text"
          placeholder="搜索菜品、套餐"
          placeholder-class="placeholder-text"
          confirm-type="search"
          @input="handleSearchInput"
          @confirm="handleSearchConfirm"
        />
        <text v-if="searchKeyword" class="clear-icon" @click="handleClearSearch">✕</text>
      </view>
    </view>

    <!-- 横向滚动分类栏 -->
    <view class="category-section">
      <scroll-view
        scroll-x
        class="category-scroll"
        :show-scrollbar="false"
        enhanced
      >
        <view class="tabs-container">
          <view
            v-for="cat in categories"
            :key="cat"
            class="tab-item"
            :class="{ active: currentCategory === cat }"
            @click="handleCategoryChange(cat)"
          >
            <text class="tab-label">{{ cat }}</text>
            <view v-if="currentCategory === cat" class="tab-indicator" />
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 菜品列表 -->
    <view class="dish-list-section">
      <view v-if="loading && dishes.length === 0" class="loading-state">
        <text class="loading-text">美味加载中...</text>
      </view>
      <view v-else-if="dishes.length === 0" class="empty-state">
        <text class="empty-icon">🍳</text>
        <text class="empty-title">暂无相关菜品</text>
        <text v-if="searchKeyword" class="empty-desc">换个搜索关键词试试看吧</text>
      </view>
      <view v-else class="dish-list">
        <DishCard
          v-for="dish in dishes"
          :key="dish._id"
          :dish="dish"
        />
      </view>
    </view>

    <!-- 底部悬浮迷你购物车栏 -->
    <MiniCartBar />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import type { Dish } from '../../types/dish';
import { cloudAdapter } from '../../services/cloud-adapter';
import DishCard from '../../components/DishCard.vue';
import MiniCartBar from '../../components/MiniCartBar.vue';

const defaultCategories: string[] = ['全部', '招牌', '减脂餐', '面食', '汤品', '饮品'];
const categories = ref<string[]>([...defaultCategories]);
const currentCategory = ref<string>('全部');
const searchKeyword = ref<string>('');
const dishes = ref<Dish[]>([]);
const loading = ref<boolean>(false);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

async function loadCategories(): Promise<void> {
  try {
    const list = await cloudAdapter.getCategories();
    if (list && list.length > 0) {
      const names = list.map((item) => item.name);
      // 保持 '全部' 作为第一个 Tab，并补充默认分类或远程分类
      const merged = Array.from(new Set(['全部', ...names, ...defaultCategories]));
      categories.value = merged;
    }
  } catch (error) {
    console.error('加载分类失败:', error);
  }
}

async function loadDishes(): Promise<void> {
  loading.value = true;
  try {
    const params = {
      category: currentCategory.value === '全部' ? undefined : currentCategory.value,
      keyword: searchKeyword.value.trim() || undefined
    };
    const result = await cloudAdapter.getDishes(params);
    dishes.value = result;
  } catch (error) {
    console.error('加载菜品列表失败:', error);
  } finally {
    loading.value = false;
  }
}

function handleCategoryChange(cat: string): void {
  if (currentCategory.value === cat) {
    return;
  }
  currentCategory.value = cat;
  loadDishes();
}

function handleSearchInput(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    loadDishes();
  }, 250);
}

function handleSearchConfirm(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  loadDishes();
}

function handleClearSearch(): void {
  searchKeyword.value = '';
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  loadDishes();
}

function goToAdmin(): void {
  uni.navigateTo({
    url: '/pages/admin/dishes'
  });
}

onMounted(() => {
  loadCategories();
  loadDishes();
});

onShow(() => {
  // 页面重新显示时同步最新菜品状态（如在管理后台修改或编辑后）
  loadDishes();
});
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 头部品牌栏 */
.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 28rpx 20rpx;
  background-color: #ffffff;
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 24rpx;
  color: #ff5722;
  margin-top: 8rpx;
  font-weight: 500;
}

.admin-link-btn {
  padding: 8rpx 24rpx;
  border-radius: 28rpx;
  border: 2rpx solid #ff5722;
  background-color: #fff9f6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.admin-link-btn:active {
  background-color: #ffebe5;
}

.admin-link-text {
  font-size: 24rpx;
  color: #ff5722;
  font-weight: 600;
}

/* 搜索栏 */
.search-section {
  background-color: #ffffff;
  padding: 0 28rpx 20rpx;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f4f4f4;
  height: 72rpx;
  border-radius: 36rpx;
  padding: 0 24rpx;
}

.search-icon {
  font-size: 28rpx;
  color: #999999;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
  height: 100%;
}

.placeholder-text {
  color: #aaaaaa;
  font-size: 26rpx;
}

.clear-icon {
  font-size: 28rpx;
  color: #999999;
  padding: 8rpx;
}

/* 横向滚动分类栏 */
.category-section {
  background-color: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.category-scroll {
  white-space: nowrap;
  width: 100%;
}

.tabs-container {
  display: inline-flex;
  padding: 0 20rpx;
  align-items: center;
}

.tab-item {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 24rpx 16rpx;
  cursor: pointer;
}

.tab-item .tab-label {
  font-size: 28rpx;
  color: #666666;
  font-weight: 500;
  transition: color 0.2s ease;
}

.tab-item.active .tab-label {
  color: #ff5722;
  font-weight: 700;
  font-size: 30rpx;
}

.tab-indicator {
  position: absolute;
  bottom: 4rpx;
  width: 40rpx;
  height: 6rpx;
  background: linear-gradient(90deg, #ff7043, #ff5722);
  border-radius: 4rpx;
}

/* 菜品列表区 */
.dish-list-section {
  flex: 1;
  padding: 24rpx 28rpx 160rpx;
  box-sizing: border-box;
}

.dish-list {
  display: flex;
  flex-direction: column;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-text {
  font-size: 26rpx;
  color: #999999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 140rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-title {
  font-size: 28rpx;
  color: #666666;
  font-weight: 600;
}

.empty-desc {
  font-size: 24rpx;
  color: #aaaaaa;
  margin-top: 10rpx;
}
</style>
