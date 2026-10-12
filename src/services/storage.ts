import type { Dish, DishCategory } from '../types/dish';
import type { Order } from '../types/order';
import type { AdminConfig } from '../types/admin';
import { initialCategories, initialDishes, initialAdminConfig } from './mock-data';

const STORAGE_KEY_DISHES = 'mini_kitchen_dishes';
const STORAGE_KEY_CATEGORIES = 'mini_kitchen_categories';
const STORAGE_KEY_ORDERS = 'mini_kitchen_orders';
const STORAGE_KEY_ADMIN = 'mini_kitchen_admin';

const memoryStore = new Map<string, unknown>();

export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function') {
      const data = uni.getStorageSync(key);
      if (data !== undefined && data !== null && data !== '') {
        return (typeof data === 'string' ? JSON.parse(data) : data) as T;
      }
    } else if (memoryStore.has(key)) {
      return memoryStore.get(key) as T;
    }
  } catch {
    // Storage read fallback
  }
  return defaultValue;
}

export function setStorage<T>(key: string, value: T): void {
  try {
    if (typeof uni !== 'undefined' && typeof uni.setStorageSync === 'function') {
      uni.setStorageSync(key, value);
    }
  } catch {
    // Storage write fallback
  }
  memoryStore.set(key, value);
}

export function getStoredDishes(): Dish[] {
  const stored = getStorage<Dish[]>(STORAGE_KEY_DISHES, []);
  if (stored.length === 0) {
    const seed = JSON.parse(JSON.stringify(initialDishes)) as Dish[];
    setStorage(STORAGE_KEY_DISHES, seed);
    return seed;
  }
  return stored;
}

export function setStoredDishes(dishes: Dish[]): void {
  setStorage(STORAGE_KEY_DISHES, dishes);
}

export function getStoredCategories(): DishCategory[] {
  const stored = getStorage<DishCategory[]>(STORAGE_KEY_CATEGORIES, []);
  if (stored.length === 0) {
    const seed = JSON.parse(JSON.stringify(initialCategories)) as DishCategory[];
    setStorage(STORAGE_KEY_CATEGORIES, seed);
    return seed;
  }
  return stored;
}

export function getStoredOrders(): Order[] {
  return getStorage<Order[]>(STORAGE_KEY_ORDERS, []);
}

export function setStoredOrders(orders: Order[]): void {
  setStorage(STORAGE_KEY_ORDERS, orders);
}

export function getStoredAdminConfig(): AdminConfig {
  return getStorage<AdminConfig>(STORAGE_KEY_ADMIN, initialAdminConfig);
}
