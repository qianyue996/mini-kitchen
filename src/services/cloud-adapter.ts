import type { Dish, DishCategory, DishStatus } from '../types/dish';
import type { Order } from '../types/order';
import type { SalesStats } from '../types/admin';
import { defaultPortions, defaultToppings } from './mock-data';
import {
  getStoredDishes,
  setStoredDishes,
  getStoredCategories,
  getStoredOrders,
  setStoredOrders,
  getStoredAdminConfig
} from './storage';

function isCloudAvailable(): boolean {
  try {
    return (
      typeof wx !== 'undefined' &&
      Boolean(wx.cloud) &&
      typeof wx.cloud.callFunction === 'function'
    );
  } catch {
    return false;
  }
}

async function callCloud<T>(
  name: string,
  action: string,
  data: Record<string, unknown> = {}
): Promise<T | null> {
  if (!isCloudAvailable()) {
    return null;
  }
  try {
    const res = await wx.cloud.callFunction({
      name,
      data: { action, ...data }
    });
    if (res && res.result) {
      const resultObj = res.result as Record<string, unknown>;
      if ('data' in resultObj && resultObj.data !== undefined) {
        return resultObj.data as T;
      }
      return res.result as T;
    }
    return null;
  } catch {
    return null;
  }
}

export interface CloudAdapter {
  getDishes(params?: { category?: string; keyword?: string; status?: string }): Promise<Dish[]>;
  getDishDetail(id: string): Promise<Dish | null>;
  saveDish(dish: Partial<Dish>): Promise<Dish>;
  toggleDishStatus(id: string, status?: DishStatus): Promise<Dish>;
  deleteDish(id: string): Promise<boolean>;
  getCategories(): Promise<DishCategory[]>;
  createOrder(orderData: Omit<Order, '_id' | 'createTime'>): Promise<Order>;
  getOrders(openid?: string): Promise<Order[]>;
  getSalesStats(): Promise<SalesStats>;
  verifyAdmin(passcode: string): Promise<boolean>;
}

export const cloudAdapter: CloudAdapter = {
  async getDishes(params?: { category?: string; keyword?: string; status?: string }): Promise<Dish[]> {
    const cloudRes = await callCloud<Dish[]>('dish-service', 'getDishes', (params ?? {}) as Record<string, unknown>);
    if (cloudRes) {
      return cloudRes;
    }

    const dishes = getStoredDishes();
    let result = [...dishes];
    if (params?.category && params.category !== '全部') {
      result = result.filter((d) => d.category === params.category);
    }
    if (params?.keyword && params.keyword.trim() !== '') {
      const kw = params.keyword.trim().toLowerCase();
      result = result.filter(
        (d) => d.name.toLowerCase().includes(kw) || d.description.toLowerCase().includes(kw)
      );
    }
    if (params?.status) {
      result = result.filter((d) => d.status === params.status);
    }
    return result;
  },

  async getDishDetail(id: string): Promise<Dish | null> {
    const cloudRes = await callCloud<Dish>('dish-service', 'getDishDetail', { id });
    if (cloudRes) {
      return cloudRes;
    }

    const dishes = getStoredDishes();
    return dishes.find((d) => d._id === id) ?? null;
  },

  async saveDish(dishData: Partial<Dish>): Promise<Dish> {
    const cloudRes = await callCloud<Dish>('dish-service', 'saveDish', { dish: dishData });
    if (cloudRes) {
      return cloudRes;
    }

    const dishes = getStoredDishes();
    const now = Date.now();
    if (dishData._id) {
      const index = dishes.findIndex((d) => d._id === dishData._id);
      if (index !== -1) {
        const existing = dishes[index];
        const updated: Dish = {
          ...existing,
          ...dishData,
          updateTime: now
        };
        dishes[index] = updated;
        setStoredDishes(dishes);
        return updated;
      }
    }

    const newDish: Dish = {
      _id: dishData._id || `dish_${now}`,
      name: dishData.name || '新建菜品',
      category: dishData.category || '招牌',
      price: dishData.price ?? 20,
      image: dishData.image || '',
      description: dishData.description || '',
      monthlySales: dishData.monthlySales ?? 0,
      rating: dishData.rating ?? 4.8,
      status: dishData.status || 'on_sale',
      portions: dishData.portions || [...defaultPortions],
      toppings: dishData.toppings || [...defaultToppings],
      createTime: now,
      updateTime: now
    };
    dishes.unshift(newDish);
    setStoredDishes(dishes);
    return newDish;
  },

  async toggleDishStatus(id: string, status?: DishStatus): Promise<Dish> {
    const cloudRes = await callCloud<Dish>('dish-service', 'updateDishStatus', { id, status });
    if (cloudRes) {
      return cloudRes;
    }

    const dishes = getStoredDishes();
    const dish = dishes.find((d) => d._id === id);
    if (!dish) {
      throw new Error(`菜品不存在: ${id}`);
    }
    const newStatus: DishStatus = status || (dish.status === 'on_sale' ? 'sold_out' : 'on_sale');
    dish.status = newStatus;
    dish.updateTime = Date.now();
    setStoredDishes(dishes);
    return dish;
  },

  async deleteDish(id: string): Promise<boolean> {
    const cloudRes = await callCloud<boolean>('dish-service', 'deleteDish', { id });
    if (typeof cloudRes === 'boolean') {
      return cloudRes;
    }

    const dishes = getStoredDishes();
    const filtered = dishes.filter((d) => d._id !== id);
    const deleted = filtered.length < dishes.length;
    if (deleted) {
      setStoredDishes(filtered);
    }
    return deleted;
  },

  async getCategories(): Promise<DishCategory[]> {
    const cloudRes = await callCloud<DishCategory[]>('dish-service', 'getCategories');
    if (cloudRes) {
      return cloudRes;
    }
    return getStoredCategories();
  },

  async createOrder(orderData: Omit<Order, '_id' | 'createTime'>): Promise<Order> {
    const cloudRes = await callCloud<Order>('order-service', 'createOrder', { order: orderData });
    if (cloudRes) {
      return cloudRes;
    }

    const orders = getStoredOrders();
    const now = Date.now();
    const newOrder: Order = {
      ...orderData,
      _id: `order_${now}_${Math.random().toString(36).slice(2, 6)}`,
      createTime: now
    };
    orders.unshift(newOrder);
    setStoredOrders(orders);
    return newOrder;
  },

  async getOrders(openid?: string): Promise<Order[]> {
    const cloudRes = await callCloud<Order[]>('order-service', 'getOrders', { openid });
    if (cloudRes) {
      return cloudRes;
    }

    const orders = getStoredOrders();
    if (openid) {
      return orders.filter((o) => o._openid === openid);
    }
    return orders;
  },

  async getSalesStats(): Promise<SalesStats> {
    const cloudRes = await callCloud<SalesStats>('order-service', 'getSalesStats');
    if (cloudRes) {
      return cloudRes;
    }

    const dishes = getStoredDishes();
    const orders = getStoredOrders();
    const onSaleCount = dishes.filter((d) => d.status === 'on_sale').length;
    const soldOutCount = dishes.filter((d) => d.status === 'sold_out').length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTime = todayStart.getTime();

    const todayOrders = orders.filter((o) => o.createTime >= todayStartTime && o.status !== 'cancelled');
    const todaySalesCount = todayOrders.reduce((sum, o) => {
      return sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    const todaySalesAmount = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      onSaleCount,
      soldOutCount,
      todaySalesCount,
      todaySalesAmount
    };
  },

  async verifyAdmin(passcode: string): Promise<boolean> {
    const cloudRes = await callCloud<boolean>('admin-service', 'verifyAdmin', { passcode });
    if (typeof cloudRes === 'boolean') {
      return cloudRes;
    }

    const adminConfig = getStoredAdminConfig();
    return passcode === adminConfig.passcode;
  }
};
