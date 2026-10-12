import { generateSpecKey, useCartStore } from './cart';
import { useAdminStore } from './admin';
import type { Dish, DishPortion, DishTopping } from '../types/dish';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runStoreTests(): Promise<void> {
  console.log('--- Starting Store Unit Tests ---');

  // Test 1: generateSpecKey
  {
    const key1 = generateSpecKey('dish_001', '标准份', ['加卤蛋', '加肥牛']);
    const key2 = generateSpecKey('dish_001', '标准份', ['加肥牛', '加卤蛋']);
    const key3 = generateSpecKey('dish_001', '小份', ['加卤蛋', '加肥牛']);

    assert(key1 === key2, 'generateSpecKey should be invariant to topping order');
    assert(key1 !== key3, 'generateSpecKey should differ for different portion');
    console.log('✓ generateSpecKey passed');
  }

  // Test 2: addToCart and price calculation
  const cart = useCartStore();
  cart.clearCart();

  const mockDish: Dish = {
    _id: 'dish_001',
    name: '农家小炒肉',
    category: '热炒',
    price: 28,
    image: '/static/dish.png',
    description: '香辣下饭',
    monthlySales: 100,
    rating: 4.9,
    status: 'on_sale',
    portions: [
      { name: '标准份', priceOffset: 0, isDefault: true },
      { name: '大份', priceOffset: 6 }
    ],
    toppings: [
      { name: '加煎蛋', price: 2 },
      { name: '加米饭', price: 2 }
    ]
  };

  const portionStd: DishPortion = { name: '标准份', priceOffset: 0 };
  const portionLarge: DishPortion = { name: '大份', priceOffset: 6 };
  const toppings: DishTopping[] = [
    { name: '加煎蛋', price: 2 },
    { name: '加米饭', price: 2 }
  ];

  {
    assert(cart.isEmpty.value === true, 'Cart should initially be empty');
    assert(cart.totalCount.value === 0, 'Total count should be 0');
    assert(cart.totalAmount.value === 0, 'Total amount should be 0');

    // Add 1 standard dish with 2 toppings: 28 + 0 + 2 + 2 = 32
    cart.addToCart(mockDish, portionStd, toppings, 1);
    assert(cart.cartItems.value.length === 1, 'Cart items length should be 1');
    assert(cart.cartItems.value[0].quantity === 1, 'Item quantity should be 1');
    assert(cart.cartItems.value[0].unitPrice === 32, 'Unit price should be 32');
    assert(cart.totalCount.value === 1, 'Total count should be 1');
    assert(cart.totalAmount.value === 32, 'Total amount should be 32');
    assert(cart.isEmpty.value === false, 'Cart should not be empty');

    // Add same spec item with quantity 2
    cart.addToCart(mockDish, portionStd, toppings, 2);
    assert(cart.cartItems.value.length === 1, 'Cart items length should remain 1');
    assert(cart.cartItems.value[0].quantity === 3, 'Item quantity should accumulate to 3');
    assert(cart.totalCount.value === 3, 'Total count should be 3');
    assert(cart.totalAmount.value === 96, 'Total amount should be 96');

    // Add different spec item (大份): 28 + 6 = 34
    cart.addToCart(mockDish, portionLarge, [], 1);
    assert(cart.cartItems.value.length === 2, 'Cart items length should be 2');
    assert(cart.totalCount.value === 4, 'Total count should be 4');
    assert(cart.totalAmount.value === 130, 'Total amount should be 96 + 34 = 130');
    console.log('✓ addToCart and quantity accumulation passed');
  }

  // Test 3: updateQuantity and removal on <= 0
  {
    const stdKey = generateSpecKey('dish_001', '标准份', ['加煎蛋', '加米饭']);
    cart.updateQuantity(stdKey, 1); // 3 + 1 = 4
    assert(cart.totalCount.value === 5, 'Total count should now be 5');

    cart.updateQuantity(stdKey, -1); // 4 - 1 = 3
    assert(cart.totalCount.value === 4, 'Total count should now be 4');

    // Decrement by 3 -> 0 -> should remove item
    cart.updateQuantity(stdKey, -3);
    assert(cart.cartItems.value.length === 1, 'Only large portion should remain');
    assert(cart.cartItems.value[0].portion === '大份', 'Remaining item should be 大份');
    console.log('✓ updateQuantity passed');
  }

  // Test 4: removeFromCart, setRemark, clearCart
  {
    const largeKey = generateSpecKey('dish_001', '大份', []);
    cart.setRemark('少辣少油');
    assert(cart.remark.value === '少辣少油', 'Remark should be updated');

    cart.removeFromCart(largeKey);
    assert(cart.cartItems.value.length === 0, 'Cart items should be empty after removal');
    assert(cart.isEmpty.value === true, 'Cart should be empty');

    // Test clearCart clears remark as well
    cart.addToCart(mockDish, portionStd, [], 1);
    assert(cart.cartItems.value.length === 1, 'Cart should have 1 item');
    cart.clearCart();
    assert(cart.cartItems.value.length === 0, 'Cart items should be cleared');
    assert(cart.remark.value === '', 'Remark should be cleared');
    console.log('✓ removeFromCart, setRemark, and clearCart passed');
  }

  // Test 5: adminStore
  {
    const admin = useAdminStore();
    admin.logoutAdmin();
    assert(admin.isAdmin.value === false, 'isAdmin should initially be false');

    const wrongLogin = await admin.loginAdmin('wrong_code');
    assert(wrongLogin === false, 'loginAdmin with wrong passcode should return false');
    assert(admin.isAdmin.value === false, 'isAdmin should remain false after failed login');

    const rightLogin = await admin.loginAdmin('888888');
    assert(rightLogin === true, 'loginAdmin with 888888 should return true');
    assert(admin.isAdmin.value === true, 'isAdmin should be true after successful login');

    admin.logoutAdmin();
    assert(admin.isAdmin.value === false, 'isAdmin should be false after logout');
    console.log('✓ adminStore passed');
  }

  console.log('--- All Store Unit Tests Passed Successfully ---');
}
