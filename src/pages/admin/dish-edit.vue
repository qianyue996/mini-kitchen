<template>
  <view class="dish-edit-page">
    <!-- 顶部操作导航栏 -->
    <view class="edit-nav-bar">
      <view class="nav-btn cancel-btn" @click="handleCancel">
        <text class="cancel-text">取消</text>
      </view>
      <text class="nav-title">{{ isEdit ? '编辑菜品' : '新增菜品' }}</text>
      <view class="nav-btn save-nav-btn" @click="handleSave">
        <text class="save-nav-text">保存</text>
      </view>
    </view>

    <!-- 主表单区域 -->
    <view class="form-container">
      <!-- 菜品图片上传与预览区 -->
      <view class="form-card image-upload-card">
        <text class="card-section-title">菜品图片</text>
        <view class="image-uploader-content">
          <view class="preview-box" @click="handleChooseImage">
            <image
              v-if="form.image"
              class="preview-img"
              :src="form.image"
              mode="aspectFill"
            />
            <view v-else class="upload-placeholder">
              <text class="placeholder-icon">📷</text>
              <text class="placeholder-text">点击上传菜品图</text>
            </view>
          </view>
          <view class="uploader-tips-col">
            <button class="choose-img-btn" @click="handleChooseImage">
              {{ form.image ? '更换图片' : '上传图片' }}
            </button>
            <text class="upload-note">推荐宽高比 1:1，展示更诱人</text>
          </view>
        </view>
      </view>

      <!-- 核心信息卡片 -->
      <view class="form-card">
        <!-- 菜品名称 -->
        <view class="form-field-row">
          <view class="field-label-wrap">
            <text class="field-label">菜品名称</text>
            <text class="required-star">*</text>
          </view>
          <input
            v-model="form.name"
            class="field-input"
            type="text"
            placeholder="例如：番茄牛腩饭"
            :maxlength="30"
          />
        </view>

        <view class="field-divider" />

        <!-- 菜品分类 -->
        <view class="form-field-row">
          <view class="field-label-wrap">
            <text class="field-label">所属分类</text>
            <text class="required-star">*</text>
          </view>
          <picker
            class="field-picker-wrap"
            mode="selector"
            :range="categoryOptions"
            :value="selectedCategoryIndex"
            @change="handleCategoryChange"
          >
            <view class="picker-display-row">
              <text :class="form.category ? 'picker-val' : 'picker-placeholder'">
                {{ form.category || '请选择分类' }}
              </text>
              <text class="picker-arrow">›</text>
            </view>
          </picker>
        </view>

        <!-- 快捷分类选择 Chips -->
        <view class="category-chips-row">
          <view
            v-for="cat in categoryOptions"
            :key="cat"
            class="cat-chip"
            :class="{ active: form.category === cat }"
            @click="selectCategoryChip(cat)"
          >
            <text class="chip-text">{{ cat }}</text>
          </view>
        </view>

        <view class="field-divider" />

        <!-- 价格 -->
        <view class="form-field-row">
          <view class="field-label-wrap">
            <text class="field-label">基础价格 (元)</text>
            <text class="required-star">*</text>
          </view>
          <view class="price-input-wrap">
            <text class="currency-prefix">¥</text>
            <input
              v-model="form.price"
              class="field-input price-input"
              type="digit"
              placeholder="0.00"
              :maxlength="8"
            />
          </view>
        </view>

        <view class="field-divider" />

        <!-- 月销量 -->
        <view class="form-field-row">
          <view class="field-label-wrap">
            <text class="field-label">初始销量 (份)</text>
          </view>
          <input
            v-model="form.monthlySales"
            class="field-input"
            type="number"
            placeholder="0"
            :maxlength="6"
          />
        </view>
      </view>

      <!-- 菜品描述卡片 -->
      <view class="form-card">
        <view class="field-label-wrap desc-header">
          <text class="field-label">菜品描述 / 亮点</text>
          <text class="char-count">{{ (form.description || '').length }}/120</text>
        </view>
        <textarea
          v-model="form.description"
          class="desc-textarea"
          placeholder="例如：浓郁番茄汁，软烂牛腩，一人食份量刚好"
          :maxlength="120"
          :auto-height="true"
        />
      </view>

      <!-- 菜品在售状态快速切换 (仅在编辑时或新增时默认) -->
      <view class="form-card status-switch-card">
        <view class="status-info-col">
          <text class="field-label">当前销售状态</text>
          <text class="status-sub">关闭后将显示为售罄，用户无法下单</text>
        </view>
        <switch
          :checked="form.status === 'on_sale'"
          color="#FF5722"
          @change="handleStatusSwitch"
        />
      </view>

      <!-- 底部操作按钮区域 -->
      <view class="bottom-actions-container">
        <!-- 主保存按钮 -->
        <button class="primary-save-btn" :loading="isSaving" @click="handleSave">
          <text class="save-btn-text">{{ isEdit ? '保存修改' : '立即新增菜品' }}</text>
        </button>

        <!-- 删除菜品危险按钮 (仅编辑模式下展示) -->
        <button
          v-if="isEdit"
          class="danger-delete-btn"
          :loading="isDeleting"
          @click="handleDeletePrompt"
        >
          <text class="delete-btn-text">删除菜品</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import type { Dish, DishStatus } from '../../types/dish';
import { cloudAdapter } from '../../services/cloud-adapter';
import { validateDish } from './utils';

interface DishFormData {
  name: string;
  category: string;
  price: string;
  image: string;
  description: string;
  monthlySales: string;
  status: DishStatus;
}

const dishId = ref<string>('');
const isEdit = computed<boolean>(() => Boolean(dishId.value));
const isSaving = ref<boolean>(false);
const isDeleting = ref<boolean>(false);

const categoryOptions = ref<string[]>(['招牌', '减脂餐', '面食', '汤品', '饮品']);

const form = reactive<DishFormData>({
  name: '',
  category: '招牌',
  price: '',
  image: '',
  description: '',
  monthlySales: '0',
  status: 'on_sale'
});

const selectedCategoryIndex = computed<number>(() => {
  const idx = categoryOptions.value.indexOf(form.category);
  return idx !== -1 ? idx : 0;
});

onLoad(async (query) => {
  await loadCategories();
  const id = query?.id;
  if (id) {
    dishId.value = id;
    await loadDishDetail(id);
  }
});

async function loadCategories(): Promise<void> {
  try {
    const list = await cloudAdapter.getCategories();
    if (list && list.length > 0) {
      categoryOptions.value = list.map((c) => c.name);
    }
  } catch (error) {
    console.error('获取分类失败，使用默认分类:', error);
  }
}

async function loadDishDetail(id: string): Promise<void> {
  try {
    uni.showLoading({ title: '加载菜品中...' });
    const dish = await cloudAdapter.getDishDetail(id);
    uni.hideLoading();

    if (dish) {
      form.name = dish.name;
      form.category = dish.category;
      form.price = String(dish.price);
      form.image = dish.image;
      form.description = dish.description || '';
      form.monthlySales = String(dish.monthlySales || 0);
      form.status = dish.status || 'on_sale';
    } else {
      uni.showToast({
        title: '未找到对应菜品',
        icon: 'none'
      });
      setTimeout(() => uni.navigateBack(), 1200);
    }
  } catch (error) {
    uni.hideLoading();
    console.error('加载菜品详情失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  }
}

function handleChooseImage(): void {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        form.image = res.tempFilePaths[0];
        uni.showToast({
          title: '图片已选取',
          icon: 'none'
        });
      }
    }
  });
}

function handleCategoryChange(e: { detail: { value: number | string } }): void {
  const idx = Number(e.detail.value);
  if (categoryOptions.value[idx]) {
    form.category = categoryOptions.value[idx];
  }
}

function selectCategoryChip(cat: string): void {
  form.category = cat;
}

function handleStatusSwitch(e: { detail: { value: boolean } }): void {
  form.status = e.detail.value ? 'on_sale' : 'sold_out';
}

function handleCancel(): void {
  uni.navigateBack();
}

async function handleSave(): Promise<void> {
  const numPrice = parseFloat(form.price);
  const validation = validateDish({
    name: form.name,
    category: form.category,
    price: numPrice,
    description: form.description
  });

  if (!validation.valid) {
    uni.showToast({
      title: validation.error || '请完善表单信息',
      icon: 'none'
    });
    return;
  }

  isSaving.value = true;
  try {
    const payload: Partial<Dish> = {
      ...(dishId.value ? { _id: dishId.value } : {}),
      name: form.name.trim(),
      category: form.category,
      price: numPrice,
      image: form.image || '',
      description: form.description.trim(),
      monthlySales: parseInt(form.monthlySales, 10) || 0,
      status: form.status
    };

    await cloudAdapter.saveDish(payload);

    uni.showToast({
      title: isEdit.value ? '修改保存成功' : '菜品新增成功',
      icon: 'success'
    });

    setTimeout(() => {
      uni.navigateBack();
    }, 600);
  } catch (error) {
    console.error('保存菜品失败:', error);
    uni.showToast({
      title: '保存失败，请重试',
      icon: 'none'
    });
  } finally {
    isSaving.value = false;
  }
}

function handleDeletePrompt(): void {
  if (!dishId.value) return;

  uni.showModal({
    title: '确认删除',
    content: `确定要删除菜品 "${form.name || '当前菜品'}" 吗？此操作无法撤销。`,
    confirmText: '确定删除',
    confirmColor: '#FF5252',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        await executeDelete();
      }
    }
  });
}

async function executeDelete(): Promise<void> {
  isDeleting.value = true;
  try {
    const deleted = await cloudAdapter.deleteDish(dishId.value);
    if (deleted) {
      uni.showToast({
        title: '菜品已删除',
        icon: 'success'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 600);
    } else {
      uni.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('删除菜品异常:', error);
    uni.showToast({
      title: '删除失败',
      icon: 'none'
    });
  } finally {
    isDeleting.value = false;
  }
}
</script>

<style scoped>
.dish-edit-page {
  min-height: 100vh;
  background-color: #F8F8F8;
  padding-bottom: 80rpx;
  box-sizing: border-box;
}

/* 顶部操作导航栏 */
.edit-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #FFFFFF;
  padding: 24rpx 32rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav-btn {
  padding: 12rpx 16rpx;
}

.cancel-text {
  font-size: 28rpx;
  color: #666666;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #222222;
}

.save-nav-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #FF5722;
}

/* 主表单容器 */
.form-container {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.form-card {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.03);
}

.card-section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #333333;
  margin-bottom: 20rpx;
  display: block;
}

/* 图片上传区 */
.image-uploader-content {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.preview-box {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  background-color: #F6F6F6;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #DDDDDD;
  flex-shrink: 0;
}

.preview-img {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 40rpx;
  margin-bottom: 4rpx;
}

.placeholder-text {
  font-size: 20rpx;
  color: #999999;
}

.uploader-tips-col {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.choose-img-btn {
  background-color: #FFF3E0;
  color: #FF5722;
  border-radius: 28rpx;
  font-size: 24rpx;
  font-weight: 600;
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 24rpx;
  align-self: flex-start;
}

.choose-img-btn::after {
  border: none;
}

.upload-note {
  font-size: 22rpx;
  color: #999999;
}

/* 表单字段行 */
.form-field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
}

.field-label-wrap {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.field-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.required-star {
  color: #FF5252;
  font-size: 28rpx;
  margin-left: 4rpx;
}

.field-input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  color: #222222;
}

.field-divider {
  height: 1rpx;
  background-color: #F1F1F1;
  margin: 6rpx 0;
}

.field-picker-wrap {
  flex: 1;
}

.picker-display-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.picker-val {
  font-size: 28rpx;
  color: #222222;
  font-weight: 600;
}

.picker-placeholder {
  font-size: 28rpx;
  color: #CCCCCC;
}

.picker-arrow {
  font-size: 32rpx;
  color: #CCCCCC;
  margin-left: 8rpx;
}

/* 快捷分类 Chip */
.category-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  padding: 12rpx 0 16rpx;
}

.cat-chip {
  background-color: #F5F5F5;
  border-radius: 20rpx;
  padding: 8rpx 20rpx;
  border: 1rpx solid transparent;
  transition: all 0.2s;
}

.cat-chip.active {
  background-color: #FFF3E0;
  border-color: #FF5722;
}

.chip-text {
  font-size: 22rpx;
  color: #666666;
}

.cat-chip.active .chip-text {
  color: #FF5722;
  font-weight: 600;
}

/* 价格输入 */
.price-input-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.currency-prefix {
  font-size: 28rpx;
  font-weight: 700;
  color: #FF5722;
  margin-right: 6rpx;
}

.price-input {
  width: 160rpx;
  text-align: right;
  font-size: 32rpx;
  font-weight: 700;
  color: #FF5722;
}

/* 描述多行文本 */
.desc-header {
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.char-count {
  font-size: 22rpx;
  color: #999999;
}

.desc-textarea {
  width: 100%;
  min-height: 140rpx;
  background-color: #F8F8F8;
  border-radius: 12rpx;
  padding: 16rpx;
  font-size: 26rpx;
  color: #333333;
  box-sizing: border-box;
}

/* 销售状态开关 */
.status-switch-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-info-col {
  display: flex;
  flex-direction: column;
}

.status-sub {
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
}

/* 底部操作按钮 */
.bottom-actions-container {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 20rpx;
}

.primary-save-btn {
  background: linear-gradient(135deg, #FF6E40 0%, #FF5722 100%);
  color: #FFFFFF;
  border-radius: 44rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 24rpx rgba(255, 87, 34, 0.3);
}

.primary-save-btn::after {
  border: none;
}

.save-btn-text {
  font-size: 30rpx;
  font-weight: 700;
}

.danger-delete-btn {
  background-color: #FFEBEE;
  color: #D32F2F;
  border-radius: 44rpx;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.danger-delete-btn::after {
  border: none;
}

.delete-btn-text {
  font-size: 28rpx;
  color: #D32F2F;
}
</style>
