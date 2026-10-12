// @ts-check
const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('--- Starting WeChat Cloud Functions Unit Tests ---');

// Check project.config.json existence and schema
const projectConfigPath = path.resolve(__dirname, '../project.config.json');
assert(fs.existsSync(projectConfigPath), 'project.config.json must exist');
const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
assert(projectConfig.cloudfunctionRoot === 'cloudfunctions/', 'project.config.json must have cloudfunctionRoot: "cloudfunctions/"');
assert(
  projectConfig.miniprogramRoot === 'dist/build/mp-weixin/' || projectConfig.miniprogramRoot === 'src/',
  'project.config.json must have valid miniprogramRoot'
);

// Intercept wx-server-sdk
const Module = require('module');
const origRequire = Module.prototype.require;

// In-memory cloud DB store
const dbStore = {
  dishes: [
    {
      _id: 'dish_001',
      name: '番茄牛腩饭',
      category: '招牌',
      price: 28,
      status: 'on_sale',
      description: '浓郁番茄',
      createTime: 1700000000000,
      updateTime: 1700000000000
    },
    {
      _id: 'dish_002',
      name: '虾仁滑蛋饭',
      category: '招牌',
      price: 26,
      status: 'sold_out',
      description: '少油健康',
      createTime: 1700000000000,
      updateTime: 1700000000000
    }
  ],
  categories: [
    { _id: 'cat_01', name: '招牌', sortOrder: 1 },
    { _id: 'cat_02', name: '减脂餐', sortOrder: 2 }
  ],
  orders: [],
  admins: [
    { _id: 'admin_1', passcode: '888888', whitelistedOpenids: ['admin_openid'] }
  ]
};

let currentOpenId = 'user_openid_123';

const mockCloud = {
  DYNAMIC_CURRENT_ENV: 'current_env',
  init: () => {},
  getWXContext: () => ({
    OPENID: currentOpenId,
    APPID: 'wx_mini_kitchen_app',
    UNIONID: 'union_id'
  }),
  database: () => {
    return {
      command: {
        gte: (val) => ({ _op: 'gte', val }),
        neq: (val) => ({ _op: 'neq', val })
      },
      RegExp: ({ regexp, options }) => new RegExp(regexp, options || ''),
      collection: (colName) => {
        return {
          where: (query) => {
            return {
              orderBy: (field, direction) => ({
                get: async () => {
                  let list = (dbStore[colName] || []).filter((item) => {
                    for (const key of Object.keys(query)) {
                      const qVal = query[key];
                      if (qVal instanceof RegExp) {
                        if (!qVal.test(item[key])) return false;
                      } else if (qVal && typeof qVal === 'object' && qVal._op === 'gte') {
                        if (!(item[key] >= qVal.val)) return false;
                      } else if (qVal && typeof qVal === 'object' && qVal._op === 'neq') {
                        if (item[key] === qVal.val) return false;
                      } else if (item[key] !== qVal) {
                        return false;
                      }
                    }
                    return true;
                  });
                  list = [...list].sort((a, b) => {
                    if (direction === 'desc') return (b[field] || 0) - (a[field] || 0);
                    return (a[field] || 0) - (b[field] || 0);
                  });
                  return { data: list };
                }
              }),
              get: async () => {
                const list = (dbStore[colName] || []).filter((item) => {
                  for (const key of Object.keys(query)) {
                    const qVal = query[key];
                    if (qVal instanceof RegExp) {
                      if (!qVal.test(item[key])) return false;
                    } else if (qVal && typeof qVal === 'object' && qVal._op === 'gte') {
                      if (!(item[key] >= qVal.val)) return false;
                    } else if (qVal && typeof qVal === 'object' && qVal._op === 'neq') {
                      if (item[key] === qVal.val) return false;
                    } else if (item[key] !== qVal) {
                      return false;
                    }
                  }
                  return true;
                });
                return { data: list };
              },
              count: async () => {
                const list = (dbStore[colName] || []).filter((item) => {
                  for (const key of Object.keys(query)) {
                    if (item[key] !== query[key]) return false;
                  }
                  return true;
                });
                return { total: list.length };
              }
            };
          },
          orderBy: (field, direction) => ({
            get: async () => {
              const list = [...(dbStore[colName] || [])].sort((a, b) => {
                if (direction === 'desc') return (b[field] || 0) - (a[field] || 0);
                return (a[field] || 0) - (b[field] || 0);
              });
              return { data: list };
            }
          }),
          get: async () => ({ data: dbStore[colName] || [] }),
          count: async () => ({ total: (dbStore[colName] || []).length }),
          doc: (id) => ({
            get: async () => {
              const found = (dbStore[colName] || []).find((item) => item._id === id);
              if (!found) {
                const err = new Error('document not found');
                err.errCode = -1;
                throw err;
              }
              return { data: found };
            },
            update: async ({ data }) => {
              const list = dbStore[colName] || [];
              const idx = list.findIndex((item) => item._id === id);
              if (idx !== -1) {
                list[idx] = { ...list[idx], ...data };
                return { stats: { updated: 1 } };
              }
              return { stats: { updated: 0 } };
            },
            set: async ({ data }) => {
              const list = dbStore[colName] || [];
              const idx = list.findIndex((item) => item._id === id);
              if (idx !== -1) {
                list[idx] = { ...data, _id: id };
              } else {
                list.push({ ...data, _id: id });
              }
              return { stats: { updated: 1 } };
            },
            remove: async () => {
              const list = dbStore[colName] || [];
              const idx = list.findIndex((item) => item._id === id);
              if (idx !== -1) {
                list.splice(idx, 1);
                return { stats: { removed: 1 } };
              }
              return { stats: { removed: 0 } };
            }
          }),
          add: async ({ data }) => {
            const _id = data._id || `gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const item = { ...data, _id };
            (dbStore[colName] = dbStore[colName] || []).push(item);
            return { _id };
          }
        };
      }
    };
  }
};

Module.prototype.require = function (id) {
  if (id === 'wx-server-sdk') {
    return mockCloud;
  }
  return origRequire.apply(this, arguments);
};

async function runTests() {
  // Test Dish Service
  const dishService = require('./dish-service/index.js');
  assert(typeof dishService.main === 'function', 'dishService must export main');

  // 1. getDishes
  let res = await dishService.main({ action: 'getDishes' });
  assert(res.success === true && Array.isArray(res.data) && res.data.length === 2, 'getDishes should return 2 dishes');

  // getDishes with category filter
  res = await dishService.main({ action: 'getDishes', category: '招牌' });
  assert(res.success === true && res.data.length === 2, 'getDishes category filter');

  // getDishes with status filter
  res = await dishService.main({ action: 'getDishes', status: 'on_sale' });
  assert(res.success === true && res.data.length === 1 && res.data[0]._id === 'dish_001', 'getDishes status filter');

  // 2. getDishDetail
  res = await dishService.main({ action: 'getDishDetail', id: 'dish_001' });
  assert(res.success === true && res.data._id === 'dish_001', 'getDishDetail found');
  res = await dishService.main({ action: 'getDishDetail', id: 'non_exist' });
  assert(res.success === true && res.data === null, 'getDishDetail non-existent returns null');

  // 3. saveDish (add new)
  res = await dishService.main({
    action: 'saveDish',
    dish: {
      name: '黑椒牛柳面',
      category: '面食',
      price: 25,
      description: '现炒精选牛柳',
      portions: [],
      toppings: []
    }
  });
  assert(res.success === true && res.data._id && res.data.name === '黑椒牛柳面', 'saveDish new dish');
  const createdDishId = res.data._id;

  // 4. saveDish (update existing)
  res = await dishService.main({
    action: 'saveDish',
    dish: {
      _id: createdDishId,
      name: '黑椒牛柳面（升级）',
      price: 28
    }
  });
  assert(res.success === true && res.data.name === '黑椒牛柳面（升级）' && res.data.price === 28, 'saveDish update');

  // 5. updateDishStatus
  res = await dishService.main({ action: 'updateDishStatus', id: 'dish_001', status: 'sold_out' });
  assert(res.success === true && res.data.status === 'sold_out', 'updateDishStatus to sold_out');
  // toggle back
  res = await dishService.main({ action: 'updateDishStatus', id: 'dish_001' });
  assert(res.success === true && res.data.status === 'on_sale', 'updateDishStatus toggle back to on_sale');

  // 6. deleteDish
  res = await dishService.main({ action: 'deleteDish', id: createdDishId });
  assert(res.success === true && res.data === true, 'deleteDish should succeed');
  res = await dishService.main({ action: 'getDishDetail', id: createdDishId });
  assert(res.data === null, 'deleted dish should not exist');

  // 7. getCategories
  res = await dishService.main({ action: 'getCategories' });
  assert(res.success === true && res.data.length === 2 && res.data[0].name === '招牌', 'getCategories');

  console.log('✓ dish-service tests passed');

  // Test Order Service
  const orderService = require('./order-service/index.js');
  assert(typeof orderService.main === 'function', 'orderService must export main');

  // 1. createOrder
  const now = Date.now();
  res = await orderService.main({
    action: 'createOrder',
    order: {
      items: [
        { dishId: 'dish_001', name: '番茄牛腩饭', unitPrice: 28, quantity: 2, portion: '标准份', toppings: [] }
      ],
      totalAmount: 56,
      remark: '少辣'
    }
  });
  assert(res.success === true && res.data._id, 'createOrder success');
  assert(res.data.status === 'cooking', 'new order status should be cooking');
  assert(res.data._openid === 'user_openid_123', 'order _openid should match user context');

  // 2. getOrders
  res = await orderService.main({ action: 'getOrders' });
  assert(res.success === true && res.data.length === 1, 'getOrders for current user');

  res = await orderService.main({ action: 'getOrders', openid: 'other_user' });
  assert(res.success === true && res.data.length === 0, 'getOrders for other user should be empty');

  // 3. getSalesStats
  res = await orderService.main({ action: 'getSalesStats' });
  assert(res.success === true, 'getSalesStats success');
  assert(res.data.onSaleCount === 1, 'onSaleCount should be 1');
  assert(res.data.soldOutCount === 1, 'soldOutCount should be 1');
  assert(res.data.todaySalesCount === 2, 'todaySalesCount should be 2');
  assert(res.data.todaySalesAmount === 56, 'todaySalesAmount should be 56');

  console.log('✓ order-service tests passed');

  // Test Admin Service
  const adminService = require('./admin-service/index.js');
  assert(typeof adminService.main === 'function', 'adminService must export main');

  // 1. verifyAdmin with hardcoded/default passcode
  res = await adminService.main({ action: 'verifyAdmin', passcode: '888888' });
  assert(res.success === true && res.data === true, 'verifyAdmin with 888888 should succeed');

  res = await adminService.main({ action: 'verifyAdmin', passcode: 'wrong_code' });
  assert(res.success === true && res.data === false, 'verifyAdmin with wrong passcode should fail');

  // 2. verifyAdmin with whitelisted openid
  currentOpenId = 'admin_openid';
  res = await adminService.main({ action: 'verifyAdmin', passcode: 'any_code' });
  assert(res.success === true && res.data === true, 'verifyAdmin with whitelisted openid should succeed');

  currentOpenId = 'regular_user';
  res = await adminService.main({ action: 'verifyAdmin', passcode: 'wrong' });
  assert(res.success === true && res.data === false, 'regular user with wrong code should fail');

  console.log('✓ admin-service tests passed');
  console.log('--- All WeChat Cloud Functions Unit Tests Passed! ---');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
