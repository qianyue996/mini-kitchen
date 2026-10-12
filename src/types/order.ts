export type OrderStatus = 'cooking' | 'delivering' | 'completed' | 'cancelled';

export interface CartItem {
  specKey: string;
  dishId: string;
  name: string;
  portion: string;
  toppings: string[];
  unitPrice: number;
  quantity: number;
  image?: string;
}

export interface Order {
  _id: string;
  _openid?: string;
  items: CartItem[];
  totalAmount: number;
  remark?: string;
  status: OrderStatus;
  createTime: number;
  updateTime?: number;
}
