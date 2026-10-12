<template>
  <view class="mine-page">
    <!-- 顶部用户资料卡片 -->
    <view class="user-card-section">
      <view class="user-info-row">
        <view class="avatar-wrap">
          <text class="avatar-emoji">👨‍🍳</text>
        </view>
        <view class="user-meta">
          <view class="name-badge-row">
            <text class="user-nickname">小厨房食客</text>
            <view class="vip-tag">
              <text class="vip-tag-text">暖心会员</text>
            </view>
          </view>
          <text class="user-sub">用心烹饪一人食 · 温暖每个日常</text>
        </view>
      </view>

      <view class="quick-stats-row">
        <view class="quick-stat-item">
          <text class="stat-number">3</text>
          <text class="stat-label">优惠券</text>
        </view>
        <view class="stat-divider" />
        <view class="quick-stat-item">
          <text class="stat-number">120</text>
          <text class="stat-label">厨房积分</text>
        </view>
        <view class="stat-divider" />
        <view class="quick-stat-item">
          <text class="stat-number">8</text>
          <text class="stat-label">已尝菜品</text>
        </view>
      </view>
    </view>

    <!-- 我的订单快捷导航卡片 -->
    <view class="section-card order-shortcuts-card">
      <view class="card-title-row" @click="handleNavToOrders('全部')">
        <text class="card-main-title">我的订单</text>
        <view class="card-more-link">
          <text class="more-text">查看全部订单</text>
          <text class="arrow-icon">›</text>
        </view>
      </view>

      <view class="shortcuts-grid">
        <view class="shortcut-item" @click="handleNavToOrders('制作中')">
          <view class="shortcut-icon-wrap">
            <text class="shortcut-emoji">🍳</text>
          </view>
          <text class="shortcut-name">制作中</text>
        </view>

        <view class="shortcut-item" @click="handleNavToOrders('配送中')">
          <view class="shortcut-icon-wrap">
            <text class="shortcut-emoji">🛵</text>
          </view>
          <text class="shortcut-name">配送中</text>
        </view>

        <view class="shortcut-item" @click="handleNavToOrders('已完成')">
          <view class="shortcut-icon-wrap">
            <text class="shortcut-emoji">✅</text>
          </view>
          <text class="shortcut-name">已完成</text>
        </view>

        <view class="shortcut-item" @click="handleNavToOrders('全部')">
          <view class="shortcut-icon-wrap">
            <text class="shortcut-emoji">📋</text>
          </view>
          <text class="shortcut-name">全部订单</text>
        </view>
      </view>
    </view>

    <!-- 管理员入口区域 -->
    <view class="section-card admin-entrance-card">
      <view class="card-title-row">
        <view class="admin-title-wrap">
          <text class="admin-header-emoji">⚙️</text>
          <text class="card-main-title">管理员后台</text>
        </view>
        <view v-if="adminStore.isAdmin.value" class="admin-status-badge">
          <text class="admin-status-text">已认证</text>
        </view>
      </view>

      <view class="admin-desc-box">
        <text class="admin-desc-text">支持菜品实时上下架、销量与售罄监控、菜名价格与分类编辑新增。</text>
      </view>

      <view class="admin-actions-row">
        <button class="primary-admin-btn" @click="handleEnterAdmin">
          <text class="btn-text">
            {{ adminStore.isAdmin.value ? '进入菜品运营管理' : '验证口令并进入后台' }}
          </text>
        </button>

        <button
          v-if="adminStore.isAdmin.value"
          class="logout-admin-btn"
          @click="handleLogoutAdmin"
        >
          <text class="logout-text">退出管理模式</text>
        </button>
      </view>
    </view>

    <!-- 便民服务与小厨房信息 -->
    <view class="section-card extra-info-card">
      <view class="extra-item-row" @click="handleCustomerService">
        <view class="item-left">
          <text class="item-emoji">☎️</text>
          <text class="item-label">联系小厨房客服</text>
        </view>
        <view class="item-right">
          <text class="item-sub">10:00 - 20:30</text>
          <text class="arrow-icon">›</text>
        </view>
      </view>

      <view class="divider-line" />

      <view class="extra-item-row" @click="handleAboutUs">
        <view class="item-left">
          <text class="item-emoji">🍲</text>
          <text class="item-label">关于迷你小厨房</text>
        </view>
        <view class="item-right">
          <text class="item-sub">一人食小食堂</text>
          <text class="arrow-icon">›</text>
        </view>
      </view>
    </view>

    <!-- 口令输入弹窗 Modal -->
    <view v-if="showModal" class="modal-overlay" @touchmove.stop.prevent>
      <view class="modal-card">
        <view class="modal-header">
          <text class="modal-title">管理员身份验证</text>
          <view class="modal-close-btn" @click="handleCloseModal">
            <text class="close-icon">✕</text>
          </view>
        </view>

        <view class="modal-body">
          <text class="modal-tip">请输入管理员访问口令后进入菜品管理后台</text>
          <view class="demo-tip-banner" @click="fillDemoPasscode">
            <text class="demo-tip-text">💡 点击快速填入演示口令：888888</text>
          </view>

          <view class="passcode-input-wrap">
            <input
              v-model="inputPasscode"
              class="passcode-input"
              type="text"
              :maxlength="20"
              placeholder="请输入管理员口令"
              :focus="showModal"
            />
          </view>
        </view>

        <view class="modal-footer">
          <button class="modal-cancel-btn" @click="handleCloseModal">取消</button>
          <button class="modal-confirm-btn" :loading="isVerifying" @click="handleSubmitPasscode">
            确认验证
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useAdminStore } from '../../store/admin';

const adminStore = useAdminStore();

const showModal = ref<boolean>(false);
const inputPasscode = ref<string>('');
const isVerifying = ref<boolean>(false);

onShow(() => {
  adminStore.checkAdminStatus();
});

function handleNavToOrders(tab: string): void {
  // 跳转到订单页面
  uni.switchTab({
    url: '/pages/order/order'
  });
}

function handleEnterAdmin(): void {
  if (adminStore.isAdmin.value) {
    uni.navigateTo({
      url: '/pages/admin/dishes'
    });
  } else {
    inputPasscode.value = '';
    showModal.value = true;
  }
}

function handleCloseModal(): void {
  showModal.value = false;
  inputPasscode.value = '';
}

function fillDemoPasscode(): void {
  inputPasscode.value = '888888';
}

async function handleSubmitPasscode(): Promise<void> {
  const code = inputPasscode.value.trim();
  if (!code) {
    uni.showToast({
      title: '请输入管理员口令',
      icon: 'none'
    });
    return;
  }

  isVerifying.value = true;
  try {
    const success = await adminStore.loginAdmin(code);
    if (success) {
      showModal.value = false;
      inputPasscode.value = '';
      uni.showToast({
        title: '管理员验证通过',
        icon: 'success'
      });
      setTimeout(() => {
        uni.navigateTo({
          url: '/pages/admin/dishes'
        });
      }, 500);
    } else {
      uni.showToast({
        title: '口令错误，请重试',
        icon: 'none'
      });
    }
  } catch {
    uni.showToast({
      title: '验证服务异常，请重试',
      icon: 'none'
    });
  } finally {
    isVerifying.value = false;
  }
}

function handleLogoutAdmin(): void {
  uni.showModal({
    title: '提示',
    content: '确定退出管理员模式吗？',
    success: (res) => {
      if (res.confirm) {
        adminStore.logoutAdmin();
        uni.showToast({
          title: '已退出管理员模式',
          icon: 'none'
        });
      }
    }
  });
}

function handleCustomerService(): void {
  uni.showModal({
    title: '联系小厨房',
    content: '欢迎拨打小厨房专线: 400-888-9999 (服务时间: 10:00 - 20:30)',
    showCancel: false,
    confirmText: '我知道了'
  });
}

function handleAboutUs(): void {
  uni.showModal({
    title: '关于迷你小厨房',
    content: '迷你小厨房专注于精选食材、少油低盐的一人食健康简餐。现点现做，为独居与上班族提供温暖干净的一餐。',
    showCancel: false,
    confirmText: '关 闭'
  });
}
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  background-color: #F8F8F8;
  padding: 24rpx 24rpx 60rpx;
  box-sizing: border-box;
}

/* 顶部用户资料卡片 */
.user-card-section {
  background: linear-gradient(135deg, #FF6E40 0%, #FF5722 100%);
  border-radius: 24rpx;
  padding: 36rpx 32rpx;
  color: #FFFFFF;
  box-shadow: 0 10rpx 24rpx rgba(255, 87, 34, 0.25);
  margin-bottom: 24rpx;
}

.user-info-row {
  display: flex;
  align-items: center;
}

.avatar-wrap {
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.5);
}

.avatar-emoji {
  font-size: 56rpx;
}

.user-meta {
  flex: 1;
}

.name-badge-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.user-nickname {
  font-size: 36rpx;
  font-weight: 700;
  color: #FFFFFF;
  margin-right: 16rpx;
}

.vip-tag {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 20rpx;
  padding: 4rpx 14rpx;
}

.vip-tag-text {
  font-size: 20rpx;
  color: #FFFFFF;
  font-weight: 500;
}

.user-sub {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.88);
}

.quick-stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-top: 36rpx;
  padding-top: 28rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.quick-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 34rpx;
  font-weight: 700;
  color: #FFFFFF;
}

.stat-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 4rpx;
}

.stat-divider {
  width: 1rpx;
  height: 36rpx;
  background-color: rgba(255, 255, 255, 0.25);
}

/* 通用白底卡片 */
.section-card {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-main-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #333333;
}

.card-more-link {
  display: flex;
  align-items: center;
}

.more-text {
  font-size: 24rpx;
  color: #999999;
  margin-right: 4rpx;
}

.arrow-icon {
  font-size: 28rpx;
  color: #CCCCCC;
}

/* 订单快捷网格 */
.shortcuts-grid {
  display: flex;
  justify-content: space-between;
  margin-top: 28rpx;
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.shortcut-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  background-color: #FFF5F0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.shortcut-emoji {
  font-size: 40rpx;
}

.shortcut-name {
  font-size: 24rpx;
  color: #444444;
}

/* 管理员入口卡片 */
.admin-title-wrap {
  display: flex;
  align-items: center;
}

.admin-header-emoji {
  font-size: 34rpx;
  margin-right: 10rpx;
}

.admin-status-badge {
  background-color: #E8F5E9;
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
}

.admin-status-text {
  font-size: 22rpx;
  color: #2E7D32;
  font-weight: 600;
}

.admin-desc-box {
  margin-top: 14rpx;
}

.admin-desc-text {
  font-size: 24rpx;
  color: #777777;
  line-height: 1.5;
}

.admin-actions-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 24rpx;
}

.primary-admin-btn {
  flex: 1;
  background-color: #FF5722;
  color: #FFFFFF;
  border-radius: 40rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 6rpx 18rpx rgba(255, 87, 34, 0.25);
}

.primary-admin-btn::after {
  border: none;
}

.logout-admin-btn {
  background-color: #F1F1F1;
  color: #666666;
  border-radius: 40rpx;
  height: 80rpx;
  line-height: 80rpx;
  padding: 0 28rpx;
  font-size: 26rpx;
}

.logout-admin-btn::after {
  border: none;
}

/* 便民服务卡片 */
.extra-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
}

.item-left {
  display: flex;
  align-items: center;
}

.item-emoji {
  font-size: 32rpx;
  margin-right: 14rpx;
}

.item-label {
  font-size: 28rpx;
  color: #333333;
}

.item-right {
  display: flex;
  align-items: center;
}

.item-sub {
  font-size: 24rpx;
  color: #999999;
  margin-right: 8rpx;
}

.divider-line {
  height: 1rpx;
  background-color: #F1F1F1;
  margin: 8rpx 0;
}

/* 模态弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 40rpx;
  box-sizing: border-box;
}

.modal-card {
  width: 100%;
  max-width: 600rpx;
  background-color: #FFFFFF;
  border-radius: 28rpx;
  padding: 36rpx;
  box-sizing: border-box;
  animation: modalIn 0.2s ease-out;
}

@keyframes modalIn {
  from {
    transform: scale(0.92);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #222222;
}

.modal-close-btn {
  padding: 8rpx;
}

.close-icon {
  font-size: 32rpx;
  color: #999999;
}

.modal-body {
  margin-bottom: 32rpx;
}

.modal-tip {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.4;
}

.demo-tip-banner {
  background-color: #FFF8E1;
  border-radius: 12rpx;
  padding: 14rpx 18rpx;
  margin: 18rpx 0;
}

.demo-tip-text {
  font-size: 24rpx;
  color: #E65100;
  font-weight: 500;
}

.passcode-input-wrap {
  margin-top: 16rpx;
  background-color: #F6F6F6;
  border-radius: 16rpx;
  padding: 0 24rpx;
}

.passcode-input {
  height: 84rpx;
  font-size: 28rpx;
  color: #222222;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
}

.modal-cancel-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #F1F1F1;
  color: #666666;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.modal-cancel-btn::after {
  border: none;
}

.modal-confirm-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #FF5722;
  color: #FFFFFF;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.modal-confirm-btn::after {
  border: none;
}
</style>
