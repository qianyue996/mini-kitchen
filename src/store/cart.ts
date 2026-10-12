import { computed, reactive } from 'vue';
import type { Dish, DishPortion, DishTopping } from '../types/dish';
import type { CartItem } from '../types/order';
import { getStorage, setStorage } from '../services/storage';

export const CART_STORAGE_KEY = 'mini_kitchen_cart';

export interface CartState {
  items: CartItem[];
  remark: string;
}

export function generateSpecKey(
  dishId: string,
  portionName: string,
  toppingNames: string[]
): string {
  const sortedToppings = [...toppingNames].sort().join(',');
  return `${dishId}:${portionName}:${sortedToppings}`;
}

function loadInitialCart(): CartState {
  const stored = getStorage<CartState | CartItem[]>(CART_STORAGE_KEY, { items: [], remark: '' });
  if (Array.isArray(stored)) {
    return { items: stored, remark: '' };
  }
  if (stored && typeof stored === 'object') {
    return {
      items: Array.isArray(stored.items) ? stored.items : [],
      remark: typeof stored.remark === 'string' ? stored.remark : ''
    };
  }
  return { items: [], remark: '' };
}

const state = reactive<CartState>(loadInitialCart());

function persistCart(): void {
  setStorage<CartState>(CART_STORAGE_KEY, {
    items: state.items,
    remark: state.remark
  });
}

export function addToCart(
  dish: Dish,
  portion: DishPortion,
  toppings: DishTopping[],
  quantity: number = 1
): void {
  if (quantity <= 0) {
    return;
  }
  const toppingNames = toppings.map((t) => t.name);
  const specKey = generateSpecKey(dish._id, portion.name, toppingNames);
  const existingItem = state.items.find((item) => item.specKey === specKey);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    const toppingTotal = toppings.reduce((sum, t) => sum + t.price, 0);
    const unitPrice = Math.round((dish.price + portion.priceOffset + toppingTotal) * 100) / 100;
    state.items.push({
      specKey,
      dishId: dish._id,
      name: dish.name,
      portion: portion.name,
      toppings: toppingNames,
      unitPrice,
      quantity,
      image: dish.image
    });
  }
  persistCart();
}

export function updateQuantity(specKey: string, delta: number): void {
  const index = state.items.findIndex((item) => item.specKey === specKey);
  if (index === -1) {
    return;
  }
  const item = state.items[index];
  item.quantity += delta;
  if (item.quantity <= 0) {
    state.items.splice(index, 1);
  }
  persistCart();
}

export function removeFromCart(specKey: string): void {
  const index = state.items.findIndex((item) => item.specKey === specKey);
  if (index !== -1) {
    state.items.splice(index, 1);
    persistCart();
  }
}

export function clearCart(): void {
  state.items = [];
  state.remark = '';
  persistCart();
}

export function setRemark(remark: string): void {
  state.remark = remark;
  persistCart();
}

export const totalCount = computed<number>(() => {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
});

export const totalAmount = computed<number>(() => {
  const sum = state.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  return Math.round(sum * 100) / 100;
});

export const isEmpty = computed<boolean>(() => {
  return state.items.length === 0;
});

export const cartItems = computed<CartItem[]>(() => state.items);
export const items = computed<CartItem[]>(() => state.items);
export const remark = computed<string>(() => state.remark);

export function useCartStore() {
  return {
    items,
    cartItems,
    remark,
    totalCount,
    totalAmount,
    isEmpty,
    generateSpecKey,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setRemark
  };
}
