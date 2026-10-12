import { runAdminTests } from '../pages/admin/admin.spec';
import { runStoreTests } from '../store/cart.spec';
import { cloudAdapter } from '../services/cloud-adapter';
import { useCartStore } from '../store/cart';
import { useAdminStore } from '../store/admin';
import type { Dish, DishPortion, DishTopping } from '../types/dish';

declare const process: { exit: (code?: number) => void };

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export async function runFullIntegrationFlow(): Promise<void> {
  console.log('--- Starting Mini-Kitchen Full Loop Integration Test ---');

  // 1. Menu: getDishes and category filtering
  console.log('Step 1: Testing Menu dish query & categories...');
  const categories = await cloudAdapter.getCategories();
  assert(categories.length > 0, 'Categories must not be empty');
  const catNames = categories.map((c) => c.name);
  assert(catNames.includes('招牌'), 'Categories must include "招牌"');

  const allDishes = await cloudAdapter.getDishes();
  assert(allDishes.length > 0, 'Dishes list must not be empty');
  const targetDish = allDishes[0];
  assert(Boolean(targetDish._id), 'First dish must have an _id');
  console.log(`✓ Menu retrieved ${allDishes.length} dishes, target dish: ${targetDish.name} (${targetDish._id})`);

  // Category filter
  const soupDishes = await cloudAdapter.getDishes({ category: '汤品' });
  for (const d of soupDishes) {
    assert(d.category === '汤品', `Dish ${d.name} must belong to category 汤品`);
  }
  console.log('✓ Category filtering verified');

  // Keyword filter
  const keywordResult = await cloudAdapter.getDishes({ keyword: targetDish.name.slice(0, 2) });
  assert(keywordResult.some((d) => d._id === targetDish._id), 'Keyword search should find target dish');
  console.log('✓ Keyword search verified');

  // 2. Detail: getDishDetail
  console.log('Step 2: Testing Dish Detail retrieval...');
  const detail = await cloudAdapter.getDishDetail(targetDish._id);
  assert(detail !== null, 'Dish detail must not be null');
  assert(detail!._id === targetDish._id, 'Detail _id must match target dish id');
  assert(Array.isArray(detail!.portions), 'Detail must have portions array');
  assert(Array.isArray(detail!.toppings), 'Detail must have toppings array');
  console.log(`✓ Detail verified: ${detail!.name}, ${detail!.portions.length} portions, ${detail!.toppings.length} toppings`);

  // 3. Cart: Select portions/toppings, add to cart, verify calculations
  console.log('Step 3: Testing Cart operations & spec keys...');
  const cart = useCartStore();
  cart.clearCart();

  const selectedPortion: DishPortion = detail!.portions[0] || { name: '标准份', priceOffset: 0 };
  const selectedToppings: DishTopping[] = detail!.toppings.slice(0, 2);
  const expectedUnitPrice = detail!.price + (selectedPortion.priceOffset || 0) + selectedToppings.reduce((s, t) => s + t.price, 0);

  cart.addToCart(detail!, selectedPortion, selectedToppings, 2);
  assert(cart.cartItems.value.length === 1, 'Cart items length should be 1');
  assert(cart.cartItems.value[0].quantity === 2, 'Quantity should be 2');
  assert(cart.cartItems.value[0].unitPrice === expectedUnitPrice, `Unit price should be ${expectedUnitPrice}`);
  assert(cart.totalCount.value === 2, 'Total count should be 2');
  assert(cart.totalAmount.value === expectedUnitPrice * 2, `Total amount should be ${expectedUnitPrice * 2}`);

  // Set order remark
  const testRemark = '少油少盐，餐具2份';
  cart.setRemark(testRemark);
  assert(cart.remark.value === testRemark, 'Cart remark must be set correctly');
  console.log(`✓ Cart verified: 2 items added, unitPrice=${expectedUnitPrice}, total=${cart.totalAmount.value}, remark="${testRemark}"`);

  // 4. Order: Create order from cart items
  console.log('Step 4: Testing Order creation...');
  const orderItems = cart.cartItems.value.map((item) => ({
    dishId: item.dishId,
    name: item.name,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    portion: item.portion,
    toppings: item.toppings,
    image: item.image,
    specKey: item.specKey
  }));

  const createdOrder = await cloudAdapter.createOrder({
    items: orderItems,
    totalAmount: cart.totalAmount.value,
    remark: cart.remark.value,
    status: 'cooking'
  });

  assert(Boolean(createdOrder._id), 'Created order must have an _id');
  assert(createdOrder.status === 'cooking', 'Created order initial status must be "cooking"');
  assert(createdOrder.totalAmount === expectedUnitPrice * 2, 'Created order totalAmount must match cart');
  assert(createdOrder.items.length === 1, 'Created order must contain 1 item line');
  assert(createdOrder.remark === testRemark, 'Created order remark must match cart remark');
  console.log(`✓ Order successfully created: ID ${createdOrder._id}, status=${createdOrder.status}`);

  // Clear cart after checkout
  cart.clearCart();
  assert(cart.isEmpty.value === true, 'Cart should be empty after clearing');

  // 5. Mine: Verify user order list contains the newly created order
  console.log('Step 5: Testing Mine (user order list)...');
  const userOrders = await cloudAdapter.getOrders();
  const foundOrder = userOrders.find((o) => o._id === createdOrder._id);
  assert(Boolean(foundOrder), 'Newly created order must appear in orders list');
  assert(foundOrder!.items[0].name === detail!.name, 'Order item name must match dish name');
  console.log(`✓ Mine order list verified: found order ${foundOrder!._id}`);

  // 6. Admin Dishes: Authentication and dashboard metrics
  console.log('Step 6: Testing Admin Authentication & Dashboard...');
  const admin = useAdminStore();
  const loginSuccess = await admin.loginAdmin('888888');
  assert(loginSuccess === true, 'Admin login with 888888 must succeed');
  assert(admin.isAdmin.value === true, 'adminStore.isAdmin must be true');

  const stats = await cloudAdapter.getSalesStats();
  assert(typeof stats.onSaleCount === 'number', 'onSaleCount must be a number');
  assert(typeof stats.soldOutCount === 'number', 'soldOutCount must be a number');
  assert(typeof stats.todaySalesCount === 'number', 'todaySalesCount must be a number');
  assert(typeof stats.todaySalesAmount === 'number', 'todaySalesAmount must be a number');
  console.log(`✓ Admin stats verified: onSale=${stats.onSaleCount}, soldOut=${stats.soldOutCount}, salesCount=${stats.todaySalesCount}, salesAmount=${stats.todaySalesAmount}`);

  // 7. Admin Edit: Edit dish name and price
  console.log('Step 7: Testing Admin Edit dish...');
  const updatedDish = await cloudAdapter.saveDish({
    _id: targetDish._id,
    name: `${targetDish.name} (精品升级版)`,
    price: targetDish.price + 5,
    description: `${targetDish.description} [主厨特调]`
  });
  assert(updatedDish._id === targetDish._id, 'Updated dish ID must match original');
  assert(updatedDish.name === `${targetDish.name} (精品升级版)`, 'Dish name must be updated');
  assert(updatedDish.price === targetDish.price + 5, 'Dish price must be updated');
  console.log(`✓ Admin dish updated: "${updatedDish.name}" - ¥${updatedDish.price}`);

  // 8. Status Toggle: Toggle dish status between on_sale and sold_out
  console.log('Step 8: Testing Dish Status toggle...');
  const toggledSoldOut = await cloudAdapter.toggleDishStatus(targetDish._id, 'sold_out');
  assert(toggledSoldOut.status === 'sold_out', 'Dish status must be toggled to sold_out');
  console.log(`✓ Dish ${targetDish._id} toggled to sold_out`);

  // Verify in getDishes filter
  const soldOutDishes = await cloudAdapter.getDishes({ status: 'sold_out' });
  assert(soldOutDishes.some((d) => d._id === targetDish._id), 'Sold out list must contain toggled dish');

  // Toggle back to on_sale
  const toggledOnSale = await cloudAdapter.toggleDishStatus(targetDish._id, 'on_sale');
  assert(toggledOnSale.status === 'on_sale', 'Dish status must be toggled back to on_sale');
  console.log(`✓ Dish ${targetDish._id} toggled back to on_sale`);

  // 9. Menu Sync: Verify latest state is reflected on home menu
  console.log('Step 9: Testing Menu sync with updated dish data...');
  const syncedDishes = await cloudAdapter.getDishes();
  const syncedDish = syncedDishes.find((d) => d._id === targetDish._id);
  assert(Boolean(syncedDish), 'Synced dishes must contain updated dish');
  assert(syncedDish!.name === `${targetDish.name} (精品升级版)`, 'Menu must reflect updated dish name');
  assert(syncedDish!.price === targetDish.price + 5, 'Menu must reflect updated dish price');
  assert(syncedDish!.status === 'on_sale', 'Menu must reflect updated dish status');
  console.log(`✓ Menu sync verified: "${syncedDish!.name}", ¥${syncedDish!.price}, status=${syncedDish!.status}`);

  console.log('--- Full User + Admin Loop Integration Test Passed Successfully! ---');
}

async function main() {
  runAdminTests();
  await runStoreTests();
  await runFullIntegrationFlow();
  console.log('\n========================================');
  console.log('ALL MINI-KITCHEN TEST SUITES PASSED! 🎉');
  console.log('========================================\n');
}

main().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
