import { validateDish, filterDishesByTab } from './utils';
import type { Dish } from '../../types/dish';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runAdminTests(): void {
  console.log('--- Starting Admin Unit Tests ---');

  // Test 1: validateDish validation rules
  {
    const emptyName = validateDish({ name: '', price: 28, category: '招牌' });
    assert(!emptyName.valid && emptyName.error === '请输入菜品名称', 'Should reject empty name');

    const emptyCategory = validateDish({ name: '番茄牛腩饭', price: 28, category: '' });
    assert(!emptyCategory.valid && emptyCategory.error === '请选择菜品分类', 'Should reject empty category');

    const invalidPriceZero = validateDish({ name: '番茄牛腩饭', price: 0, category: '招牌' });
    assert(!invalidPriceZero.valid && invalidPriceZero.error === '菜品价格必须大于0', 'Should reject zero price');

    const invalidPriceNegative = validateDish({ name: '番茄牛腩饭', price: -5, category: '招牌' });
    assert(!invalidPriceNegative.valid && invalidPriceNegative.error === '菜品价格必须大于0', 'Should reject negative price');

    const validDish = validateDish({ name: '番茄牛腩饭', price: 28, category: '招牌', description: '一人食刚刚好' });
    assert(validDish.valid && !validDish.error, 'Should accept valid dish input');
    console.log('✓ validateDish passed');
  }

  // Test 2: filterDishesByTab
  {
    const mockDishes: Dish[] = [
      {
        _id: '1',
        name: '番茄牛腩饭',
        category: '招牌',
        price: 28,
        image: '',
        description: '',
        monthlySales: 10,
        rating: 4.8,
        status: 'on_sale',
        portions: [],
        toppings: []
      },
      {
        _id: '2',
        name: '虾仁滑蛋饭',
        category: '招牌',
        price: 26,
        image: '',
        description: '',
        monthlySales: 5,
        rating: 4.9,
        status: 'sold_out',
        portions: [],
        toppings: []
      }
    ];

    const all = filterDishesByTab(mockDishes, '全部');
    assert(all.length === 2, 'Filter 全部 should return 2 dishes');

    const onSale = filterDishesByTab(mockDishes, '在售');
    assert(onSale.length === 1 && onSale[0]._id === '1', 'Filter 在售 should return on_sale dishes only');

    const soldOut = filterDishesByTab(mockDishes, '售罄');
    assert(soldOut.length === 1 && soldOut[0]._id === '2', 'Filter 售罄 should return sold_out dishes only');
    console.log('✓ filterDishesByTab passed');
  }

  console.log('--- All Admin Unit Tests Passed Successfully ---');
}
