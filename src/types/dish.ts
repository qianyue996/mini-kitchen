export type DishStatus = 'on_sale' | 'sold_out';

export interface DishPortion {
  name: string;
  priceOffset: number;
  isDefault?: boolean;
}

export interface DishTopping {
  name: string;
  price: number;
}

export interface DishCategory {
  _id: string;
  name: string;
  sortOrder?: number;
}

export interface Dish {
  _id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  monthlySales: number;
  rating: number;
  status: DishStatus;
  portions: DishPortion[];
  toppings: DishTopping[];
  createTime?: number;
  updateTime?: number;
}
