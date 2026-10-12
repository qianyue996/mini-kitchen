import type { Dish, DishCategory, DishPortion, DishTopping } from '../types/dish';
import type { AdminConfig } from '../types/admin';

export const initialCategories: DishCategory[] = [
  { _id: 'cat_01', name: '招牌', sortOrder: 1 },
  { _id: 'cat_02', name: '减脂餐', sortOrder: 2 },
  { _id: 'cat_03', name: '面食', sortOrder: 3 },
  { _id: 'cat_04', name: '汤品', sortOrder: 4 },
  { _id: 'cat_05', name: '饮品', sortOrder: 5 }
];

export const defaultPortions: DishPortion[] = [
  { name: '标准份', priceOffset: 0, isDefault: true },
  { name: '小份', priceOffset: -4, isDefault: false }
];

export const defaultToppings: DishTopping[] = [
  { name: '加卤蛋', price: 4 },
  { name: '加青菜', price: 3 },
  { name: '加肥牛', price: 8 }
];

export const initialDishes: Dish[] = [
  {
    _id: 'dish_001',
    name: '番茄牛腩饭',
    category: '招牌',
    price: 28,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    description: '浓郁番茄汁，软烂牛腩，搭配米饭刚好一人食',
    monthlySales: 128,
    rating: 4.8,
    status: 'on_sale',
    portions: defaultPortions,
    toppings: defaultToppings,
    createTime: 1776000000000,
    updateTime: 1776000000000
  },
  {
    _id: 'dish_002',
    name: '虾仁滑蛋饭',
    category: '招牌',
    price: 26,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80',
    description: '鲜嫩高蛋白大虾仁与滑嫩温润鸡蛋，少油健康',
    monthlySales: 96,
    rating: 4.8,
    status: 'on_sale',
    portions: defaultPortions,
    toppings: defaultToppings,
    createTime: 1776000000000,
    updateTime: 1776000000000
  },
  {
    _id: 'dish_003',
    name: '菌菇鸡汤',
    category: '汤品',
    price: 22,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80',
    description: '严选老鸡与多种山珍菌菇文火慢炖，鲜美醇香',
    monthlySales: 64,
    rating: 4.8,
    status: 'on_sale',
    portions: defaultPortions,
    toppings: defaultToppings,
    createTime: 1776000000000,
    updateTime: 1776000000000
  },
  {
    _id: 'dish_004',
    name: '黑椒牛柳面',
    category: '面食',
    price: 25,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    description: '现炒精选牛柳裹挟香浓黑椒汁，面条劲道爽滑',
    monthlySales: 112,
    rating: 4.8,
    status: 'on_sale',
    portions: defaultPortions,
    toppings: defaultToppings,
    createTime: 1776000000000,
    updateTime: 1776000000000
  }
];

export const initialAdminConfig: AdminConfig = {
  _id: 'admin_config',
  passcode: '888888',
  whitelistedOpenids: []
};
