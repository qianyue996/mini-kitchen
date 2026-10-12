<template>
  <view class="order-page">
    <!-- 顶部状态筛选栏 -->
    <view class="filter-header">
      <view class="tabs-row">
        <view
          v-for="tab in filterTabs"
          :key="tab"
          class="tab-item"
          :class="{ active: currentTab === tab }"
          @click="handleTabChange(tab)"
        >
          <text class="tab-label">{{ tab }}</text>
          <view v-if="currentTab === tab" class="tab-indicator" />
        </view>
      </view>
    </view>

    <!-- 订单列表内容 -->
    <view class="order-content">
      <!-- 加载中状态 -->
      <view v-if="loading && orders.length === 0" class="loading-box">
        <text class="loading-text">加载订单中...</text>
      </view>

      <!-- 空订单状态 -->
      <view v-else-if="filteredOrders.length === 0" class="empty-state">
        <view class="empty-icon-wrap">
          <text class="empty-emoji">🧾</text>
        </view>
        <text class="empty-title">暂无相关订单</text>
        <text class="empty-subtitle">快去犒劳一下自己的胃吧</text>
        <button class="go-menu-btn" @click="handleGoToMenu">去点餐</button>
      </view>

      <!-- 订单卡片列表 -->
      <view v-else class="order-list">
        <view
          v-for="order in filteredOrders"
          :key="order._id"
          class="order-card"
        >
          <!-- 卡片头部：订单编号与状态徽标 -->
          <view class="card-header">
            <view class="order-sn-wrap">
              <text class="order-sn-prefix">单号</text>
              <text class="order-sn">{{ formatOrderId(order._id) }}</text>
            </view>
            <view class="status-badge" :class="getStatusBadgeClass(order.status)">
              <text class="status-badge-text">{{ getStatusBadgeText(order.status) }}</text>
            </view>
          </view>

          <!-- 下单时间 -->
          <view class="order-time-row">
            <text class="order-time-text">{{ formatTime(order.createTime) }}</text>
          </view>

          <!-- 菜品明细列表 -->
          <view class="items-breakdown">
            <view
              v-for="(item, idx) in order.items"
              :key="item.specKey || idx"
              class="breakdown-row"
            >
              <image
                class="dish-thumb"
                :src="item.image || defaultDishImage"
                mode="aspectFill"
              />
              <view class="dish-info">
                <view class="dish-title-line">
                  <text class="dish-name">{{ item.name }}</text>
                  <text class="dish-unit-price">¥{{ item.unitPrice }}</text>
                </view>
                <view class="dish-spec-line">
                  <text class="dish-spec-tag">{{ formatItemSpec(item) }}</text>
                  <text class="dish-qty">x{{ item.quantity }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 整单备注展示 (若有) -->
          <view v-if="order.remark && order.remark.trim() !== ''" class="order-remark-box">
            <text class="remark-title">备注：</text>
            <text class="remark-content">{{ order.remark }}</text>
          </view>

          <!-- 底部汇总行与快捷操作 -->
          <view class="card-footer">
            <view class="total-info">
              <text class="total-count-text">共 {{ getItemTotalCount(order) }} 件商品</text>
              <text class="pay-label">实付</text>
              <text class="pay-currency">¥</text>
              <text class="pay-amount">{{ order.totalAmount }}</text>
            </view>

            <view class="footer-actions">
              <button
                v-if="order.status === 'cooking' || order.status === 'delivering'"
                class="action-btn outline-btn"
                @click="handleCheckProgress(order)"
              >
                进度查询
              </button>
              <button
                class="action-btn primary-btn"
                @click="handleReorder(order)"
              >
                再来一单
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import type { Order, OrderStatus, CartItem } from '../../types/order';
import { cloudAdapter } from '../../services/cloud-adapter';
import { useCartStore } from '../../store/cart';

const cartStore = useCartStore();

const defaultDishImage = '/static/logo.png';

const filterTabs = ['全部', '制作中', '配送中', '已完成'] as const;
type FilterTab = (typeof filterTabs)[number];

const currentTab = ref<FilterTab>('全部');
const orders = ref<Order[]>([]);
const loading = ref<boolean>(false);

// 根据当前 Tab 筛选订单
const filteredOrders = computed<Order[]>(() => {
  if (currentTab.value === '全部') {
    return orders.value;
  }
  const statusMap: Record<Exclude<FilterTab, '全部'>, OrderStatus> = {
    制作中: 'cooking',
    配送中: 'delivering',
    已完成: 'completed'
  };
  const targetStatus = statusMap[currentTab.value];
  return orders.value.filter((o) => o.status === targetStatus);
});

// 格式化订单编号 (缩短显示末尾或完整)
function formatOrderId(id: string): string {
  if (!id) return '';
  if (id.length <= 14) return id;
  return id.replace('order_', '#');
}

// 格式化时间戳
function formatTime(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

// 格式化规格
function formatItemSpec(item: CartItem): string {
  const parts: string[] = [];
  if (item.portion) {
    parts.push(item.portion);
  }
  if (item.toppings && item.toppings.length > 0) {
    parts.push(item.toppings.join(' · '));
  }
  return parts.length > 0 ? parts.join(' · ') : '标准配置';
}

// 订单商品总数
function getItemTotalCount(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

// 状态文本
function getStatusBadgeText(status: OrderStatus): string {
  switch (status) {
    case 'cooking':
      return '制作中';
    case 'delivering':
      return '配送中';
    case 'completed':
      return '已完成';
    case 'cancelled':
      return '已取消';
    default:
      return '处理中';
  }
}

// 状态样式类
function getStatusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case 'cooking':
      return 'badge-cooking';
    case 'delivering':
      return 'badge-delivering';
    case 'completed':
      return 'badge-completed';
    case 'cancelled':
      return 'badge-cancelled';
    default:
      return 'badge-cooking';
  }
}

// 切换 Tab
function handleTabChange(tab: FilterTab): void {
  currentTab.value = tab;
}

// 加载订单列表
async function loadOrders(): Promise<void> {
  loading.value = true;
  try {
    const list = await cloudAdapter.getOrders();
    orders.value = Array.isArray(list) ? list : [];
  } catch (error) {
    uni.showToast({
      title: '获取订单失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
}

// 页面可见时自动刷新
onShow(() => {
  loadOrders();
});

// 下拉刷新
onPullDownRefresh(async () => {
  await loadOrders();
  uni.stopPullDownRefresh();
});

// 跳转点餐菜单
function handleGoToMenu(): void {
  uni.switchTab({
    url: '/pages/index/index'
  });
}

// 查看进度
function handleCheckProgress(order: Order): void {
  let content = '后厨正在为您现做烹饪，请稍候！';
  if (order.status === 'delivering') {
    content = '美食正在飞速配送途中，请保持电话畅通！';
  }
  uni.showModal({
    title: '订单状态',
    content,
    showCancel: false,
    confirmColor: '#FF5722'
  });
}

// 再来一单：将订单中所有菜品重新加入购物车并跳转到购物车
function handleReorder(order: Order): void {
  uni.showModal({
    title: '再来一单',
    content: '将本单菜品加入购物车并前往结算？',
    confirmColor: '#FF5722',
    success: (res) => {
      if (res.confirm) {
        order.items.forEach((item) => {
          // 直接更新或者添加到现有购物车
          cartStore.updateQuantity(item.specKey, item.quantity);
        });
        uni.switchTab({
          url: '/pages/cart/cart'
        });
      }
    }
  });
}
</script>

<style scoped>
.order-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 60rpx;
  box-sizing: border-box;
}

/* 顶部状态筛选栏 */
.filter-header {
  background-color: #ffffff;
  position: sticky;
  top: 0;
  z-index: 20;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.tabs-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 88rpx;
}

.tab-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 24rpx;
}

.tab-label {
  font-size: 28rpx;
  color: #666666;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-item.active .tab-label {
  color: #ff5722;
  font-weight: 700;
  font-size: 30rpx;
}

.tab-indicator {
  position: absolute;
  bottom: 6rpx;
  width: 40rpx;
  height: 6rpx;
  background-color: #ff5722;
  border-radius: 4rpx;
}

/* 主内容区 */
.order-content {
  padding: 24rpx;
}

/* 加载中 */
.loading-box {
  padding: 120rpx 0;
  text-align: center;
}

.loading-text {
  font-size: 28rpx;
  color: #999999;
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
}

.empty-subtitle {
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 48rpx;
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

/* 订单卡片列表 */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.order-card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

/* 订单头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12rpx;
}

.order-sn-wrap {
  display: flex;
  align-items: center;
}

.order-sn-prefix {
  font-size: 24rpx;
  color: #999999;
  margin-right: 8rpx;
}

.order-sn {
  font-size: 26rpx;
  font-weight: 600;
  color: #444444;
}

/* 状态徽标 */
.status-badge {
  padding: 6rpx 18rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 600;
}

.badge-cooking {
  background-color: #fff3e8;
  color: #ff6e26;
}

.badge-delivering {
  background-color: #e6f4ff;
  color: #1677ff;
}

.badge-completed {
  background-color: #e6f9ed;
  color: #2bb65e;
}

.badge-cancelled {
  background-color: #f0f0f0;
  color: #888888;
}

/* 下单时间 */
.order-time-row {
  margin-bottom: 20rpx;
}

.order-time-text {
  font-size: 22rpx;
  color: #aaaaaa;
}

/* 菜品细明细列表 */
.items-breakdown {
  border-top: 1rpx solid #f4f4f6;
  border-bottom: 1rpx solid #f4f4f6;
  padding: 16rpx 0;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.breakdown-row {
  display: flex;
  align-items: center;
}

.dish-thumb {
  width: 90rpx;
  height: 90rpx;
  border-radius: 12rpx;
  background-color: #f0f0f0;
  margin-right: 18rpx;
  flex-shrink: 0;
}

.dish-info {
  flex: 1;
  min-width: 0;
}

.dish-title-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6rpx;
}

.dish-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #222222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.dish-unit-price {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  margin-left: 12rpx;
}

.dish-spec-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dish-spec-tag {
  font-size: 22rpx;
  color: #888888;
  background-color: #f7f7f8;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

.dish-qty {
  font-size: 24rpx;
  color: #999999;
}

/* 订单备注框 */
.order-remark-box {
  background-color: #fafafc;
  padding: 14rpx 18rpx;
  border-radius: 12rpx;
  margin-top: 18rpx;
  display: flex;
  align-items: baseline;
}

.remark-title {
  font-size: 24rpx;
  font-weight: 600;
  color: #ff5722;
  flex-shrink: 0;
}

.remark-content {
  font-size: 24rpx;
  color: #666666;
}

/* 底部结算与操作 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 22rpx;
}

.total-info {
  display: flex;
  align-items: baseline;
}

.total-count-text {
  font-size: 22rpx;
  color: #999999;
  margin-right: 12rpx;
}

.pay-label {
  font-size: 24rpx;
  color: #333333;
  font-weight: 500;
  margin-right: 4rpx;
}

.pay-currency {
  font-size: 24rpx;
  font-weight: bold;
  color: #ff5722;
}

.pay-amount {
  font-size: 34rpx;
  font-weight: 800;
  color: #ff5722;
}

.footer-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  height: 60rpx;
  line-height: 58rpx;
  padding: 0 24rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  font-weight: 600;
  margin: 0;
}

.outline-btn {
  background-color: #ffffff;
  border: 1rpx solid #dddddd;
  color: #666666;
}

.primary-btn {
  background: #ff5722;
  color: #ffffff;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(255, 87, 34, 0.25);
}
</style>
