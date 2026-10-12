<template>
  <view class="dishes-admin-page">
    <!-- 顶部操作栏 -->
    <view class="admin-top-bar">
      <view class="bar-left">
        <text class="bar-title">菜品管理</text>
        <text class="bar-subtitle">实时监控与菜品调度</text>
      </view>
      <button class="add-dish-btn" @click="handleNavToCreate">
        <text class="add-icon">+</text>
        <text class="add-text">新增菜品</text>
      </button>
    </view>

    <!-- 顶部核心指标看板 Banner -->
    <view class="metrics-banner-card">
      <view class="metric-col" @click="handleSwitchTab('在售')">
        <text class="metric-num on-sale-color">{{ stats.onSaleCount }}</text>
        <view class="metric-label-row">
          <view class="status-dot green-dot" />
          <text class="metric-label">在售菜品</text>
        </view>
      </view>

      <view class="metric-divider" />

      <view class="metric-col" @click="handleSwitchTab('售罄')">
        <text class="metric-num sold-out-color">{{ stats.soldOutCount }}</text>
        <view class="metric-label-row">
          <view class="status-dot gray-dot" />
          <text class="metric-label">已售罄</text>
        </view>
      </view>

      <view class="metric-divider" />

      <view class="metric-col">
        <text class="metric-num sales-color">{{ stats.todaySalesCount }}</text>
        <view class="metric-label-row">
          <text class="metric-label">今日销量</text>
        </view>
      </view>
    </view>

    <!-- 分类筛选 Tabs -->
    <view class="tabs-container">
      <view
        v-for="tab in filterTabs"
        :key="tab"
        class="tab-item"
        :class="{ active: currentTab === tab }"
        @click="handleSwitchTab(tab)"
      >
        <text class="tab-title">{{ getTabLabel(tab) }}</text>
        <view v-if="currentTab === tab" class="tab-line" />
      </view>
    </view>

    <!-- 菜品列表内容 -->
    <view class="dish-list-content">
      <!-- 加载中 -->
      <view v-if="loading && dishes.length === 0" class="loading-state">
        <text class="loading-text">正在加载菜品数据...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="filteredDishes.length === 0" class="empty-state">
        <text class="empty-emoji">🍲</text>
        <text class="empty-tip">暂无相关菜品</text>
        <button class="empty-add-btn" @click="handleNavToCreate">立即新增一道菜</button>
      </view>

      <!-- 菜品列表卡片 -->
      <view v-else class="dish-cards-wrapper">
        <view
          v-for="dish in filteredDishes"
          :key="dish._id"
          class="dish-admin-card"
        >
          <!-- 菜品缩略图 -->
          <view class="dish-thumb-wrap" @click="handleNavToEdit(dish._id)">
            <image
              v-if="dish.image"
              class="dish-thumb"
              :src="dish.image"
              mode="aspectFill"
            />
            <view v-else class="dish-thumb-placeholder">
              <text class="placeholder-emoji">🍱</text>
            </view>
            <view v-if="dish.status === 'sold_out'" class="sold-out-mask">
              <text class="mask-text">售罄</text>
            </view>
          </view>

          <!-- 菜品信息区域 -->
          <view class="dish-info-wrap">
            <view class="dish-name-row">
              <text class="dish-name">{{ dish.name }}</text>
              <view class="category-tag">
                <text class="category-text">{{ dish.category }}</text>
              </view>
            </view>

            <text v-if="dish.description" class="dish-desc" :numberOfLines="1">
              {{ dish.description }}
            </text>

            <view class="dish-meta-row">
              <text class="monthly-sales">月售 {{ dish.monthlySales || 0 }} 份</text>
              <view class="price-box">
                <text class="price-symbol">¥</text>
                <text class="price-value">{{ dish.price }}</text>
              </view>
            </view>
          </view>

          <!-- 操作按钮区：上下架切换 + 编辑 -->
          <view class="dish-actions-wrap">
            <!-- 快速状态切换 Badge/Pill -->
            <view
              class="status-toggle-pill"
              :class="dish.status === 'on_sale' ? 'pill-on-sale' : 'pill-sold-out'"
              @click.stop="handleToggleStatus(dish)"
            >
              <text class="toggle-dot" />
              <text class="toggle-text">
                {{ dish.status === 'on_sale' ? '在售中' : '已售罄' }}
              </text>
            </view>

            <!-- 编辑按钮 -->
            <button class="edit-btn" @click.stop="handleNavToEdit(dish._id)">
              <text class="edit-btn-text">编辑</text>
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import type { Dish } from '../../types/dish';
import type { SalesStats } from '../../types/admin';
import { cloudAdapter } from '../../services/cloud-adapter';
import { useAdminStore } from '../../store/admin';
import { filterDishesByTab } from './utils';

type FilterTabType = '全部' | '在售' | '售罄';

const adminStore = useAdminStore();
const dishes = ref<Dish[]>([]);
const loading = ref<boolean>(false);
const currentTab = ref<FilterTabType>('全部');
const filterTabs: FilterTabType[] = ['全部', '在售', '售罄'];

const stats = ref<SalesStats>({
  onSaleCount: 0,
  soldOutCount: 0,
  todaySalesCount: 0,
  todaySalesAmount: 0
});

const filteredDishes = computed<Dish[]>(() => {
  return filterDishesByTab(dishes.value, currentTab.value);
});

onShow(() => {
  adminStore.checkAdminStatus();
  if (!adminStore.isAdmin.value) {
    uni.showToast({
      title: '请先完成管理员验证',
      icon: 'none'
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1200);
    return;
  }
  loadData();
});

onPullDownRefresh(async () => {
  await loadData();
  uni.stopPullDownRefresh();
});

async function loadData(): Promise<void> {
  loading.value = true;
  try {
    const [statsData, dishesData] = await Promise.all([
      cloudAdapter.getSalesStats(),
      cloudAdapter.getDishes()
    ]);
    stats.value = statsData;
    dishes.value = dishesData;
  } catch (error) {
    console.error('加载菜品数据失败:', error);
    uni.showToast({
      title: '数据加载失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
}

function handleSwitchTab(tab: FilterTabType): void {
  currentTab.value = tab;
}

function getTabLabel(tab: FilterTabType): string {
  if (tab === '在售') {
    return `在售 (${stats.value.onSaleCount})`;
  }
  if (tab === '售罄') {
    return `售罄 (${stats.value.soldOutCount})`;
  }
  const total = stats.value.onSaleCount + stats.value.soldOutCount;
  return `全部 (${total})`;
}

async function handleToggleStatus(dish: Dish): Promise<void> {
  const willBeSoldOut = dish.status === 'on_sale';
  const targetStatus = willBeSoldOut ? 'sold_out' : 'on_sale';
  const actionText = willBeSoldOut ? '标记为售罄' : '恢复在售';

  try {
    uni.showLoading({ title: '更新中...' });
    const updatedDish = await cloudAdapter.toggleDishStatus(dish._id, targetStatus);
    
    // 局部更新列表对应菜品状态
    const index = dishes.value.findIndex((d) => d._id === dish._id);
    if (index !== -1) {
      dishes.value[index] = { ...dishes.value[index], status: updatedDish.status };
    }

    // 重新获取最新统计
    const newStats = await cloudAdapter.getSalesStats();
    stats.value = newStats;

    uni.hideLoading();
    uni.showToast({
      title: `${dish.name}已${actionText}`,
      icon: 'success'
    });
  } catch (error) {
    uni.hideLoading();
    console.error('更新菜品状态失败:', error);
    uni.showToast({
      title: '操作失败，请重试',
      icon: 'none'
    });
  }
}

function handleNavToCreate(): void {
  uni.navigateTo({
    url: '/pages/admin/dish-edit'
  });
}

function handleNavToEdit(dishId: string): void {
  uni.navigateTo({
    url: `/pages/admin/dish-edit?id=${dishId}`
  });
}
</script>

<style scoped>
.dishes-admin-page {
  min-height: 100vh;
  background-color: #F8F8F8;
  padding: 24rpx 24rpx 60rpx;
  box-sizing: border-box;
}

/* 顶部操作栏 */
.admin-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.bar-left {
  display: flex;
  flex-direction: column;
}

.bar-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #222222;
}

.bar-subtitle {
  font-size: 22rpx;
  color: #888888;
  margin-top: 4rpx;
}

.add-dish-btn {
  background: linear-gradient(135deg, #FF6E40 0%, #FF5722 100%);
  color: #FFFFFF;
  border-radius: 36rpx;
  height: 68rpx;
  line-height: 68rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 6rpx 16rpx rgba(255, 87, 34, 0.28);
}

.add-dish-btn::after {
  border: none;
}

.add-icon {
  font-size: 32rpx;
  font-weight: 700;
  margin-right: 6rpx;
}

.add-text {
  font-size: 26rpx;
  font-weight: 600;
}

/* 核心看板卡片 */
.metrics-banner-card {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 30rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  margin-bottom: 24rpx;
}

.metric-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.metric-num {
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.2;
}

.on-sale-color {
  color: #2E7D32;
}

.sold-out-color {
  color: #D32F2F;
}

.sales-color {
  color: #FF5722;
}

.metric-label-row {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
}

.status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  margin-right: 8rpx;
}

.green-dot {
  background-color: #2E7D32;
}

.gray-dot {
  background-color: #D32F2F;
}

.metric-label {
  font-size: 22rpx;
  color: #777777;
}

.metric-divider {
  width: 1rpx;
  height: 48rpx;
  background-color: #EEEEEE;
}

/* 标签切换栏 */
.tabs-container {
  display: flex;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx 0;
  position: relative;
}

.tab-title {
  font-size: 26rpx;
  color: #666666;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-item.active .tab-title {
  color: #FF5722;
  font-weight: 700;
}

.tab-line {
  position: absolute;
  bottom: 6rpx;
  width: 40rpx;
  height: 4rpx;
  background-color: #FF5722;
  border-radius: 2rpx;
}

/* 菜品管理卡片列表 */
.dish-list-content {
  display: flex;
  flex-direction: column;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
}

.loading-text {
  font-size: 26rpx;
  color: #999999;
}

.empty-emoji {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.empty-tip {
  font-size: 28rpx;
  color: #888888;
  margin-bottom: 28rpx;
}

.empty-add-btn {
  background-color: #FF5722;
  color: #FFFFFF;
  border-radius: 36rpx;
  font-size: 26rpx;
  padding: 0 36rpx;
  height: 68rpx;
  line-height: 68rpx;
}

.dish-cards-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.dish-admin-card {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
}

.dish-thumb-wrap {
  width: 130rpx;
  height: 130rpx;
  border-radius: 16rpx;
  position: relative;
  overflow: hidden;
  margin-right: 20rpx;
  flex-shrink: 0;
  background-color: #F6F6F6;
}

.dish-thumb {
  width: 100%;
  height: 100%;
}

.dish-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #FFF3E0;
}

.placeholder-emoji {
  font-size: 54rpx;
}

.sold-out-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mask-text {
  color: #FFFFFF;
  font-size: 22rpx;
  font-weight: 700;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

.dish-info-wrap {
  flex: 1;
  min-width: 0;
  margin-right: 16rpx;
}

.dish-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.dish-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #222222;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-tag {
  background-color: #FFF3E0;
  border-radius: 8rpx;
  padding: 2rpx 12rpx;
  flex-shrink: 0;
}

.category-text {
  font-size: 20rpx;
  color: #FF5722;
  font-weight: 600;
}

.dish-desc {
  font-size: 22rpx;
  color: #888888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 10rpx;
}

.dish-meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.monthly-sales {
  font-size: 22rpx;
  color: #999999;
}

.price-box {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: 24rpx;
  color: #FF5722;
  font-weight: 700;
}

.price-value {
  font-size: 34rpx;
  color: #FF5722;
  font-weight: 800;
}

/* 操作区域 */
.dish-actions-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16rpx;
  flex-shrink: 0;
}

.status-toggle-pill {
  padding: 8rpx 18rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.pill-on-sale {
  background-color: #E8F5E9;
}

.pill-on-sale .toggle-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: #2E7D32;
  margin-right: 8rpx;
}

.pill-on-sale .toggle-text {
  font-size: 22rpx;
  color: #2E7D32;
  font-weight: 600;
}

.pill-sold-out {
  background-color: #FFEBEE;
}

.pill-sold-out .toggle-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background-color: #D32F2F;
  margin-right: 8rpx;
}

.pill-sold-out .toggle-text {
  font-size: 22rpx;
  color: #D32F2F;
  font-weight: 600;
}

.edit-btn {
  background-color: #F5F5F5;
  color: #444444;
  border-radius: 24rpx;
  height: 52rpx;
  line-height: 52rpx;
  padding: 0 24rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.edit-btn::after {
  border: none;
}

.edit-btn-text {
  font-size: 22rpx;
}
</style>
