import type { Dish } from '../../types/dish';

export interface DishValidationResult {
  valid: boolean;
  error?: string;
}

export function validateDish(data: {
  name?: string;
  price?: number;
  category?: string;
  description?: string;
}): DishValidationResult {
  if (!data.name || data.name.trim() === '') {
    return { valid: false, error: '请输入菜品名称' };
  }
  if (!data.category || data.category.trim() === '') {
    return { valid: false, error: '请选择菜品分类' };
  }
  if (data.price === undefined || isNaN(data.price) || data.price <= 0) {
    return { valid: false, error: '菜品价格必须大于0' };
  }
  return { valid: true };
}

export function filterDishesByTab(
  dishes: Dish[],
  tab: '全部' | '在售' | '售罄'
): Dish[] {
  if (tab === '在售') {
    return dishes.filter((dish) => dish.status === 'on_sale');
  }
  if (tab === '售罄') {
    return dishes.filter((dish) => dish.status === 'sold_out');
  }
  return dishes;
}
