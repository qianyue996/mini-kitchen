# 迷你小厨房微信小程序执行计划 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 `origin/` 原型图与设计规格说明书，使用 Uni-app (Vue 3 + TS) 构建包含点餐台、菜品详情与加料定制、购物车、订单、个人中心及管理员后台（看板/上下架/编辑新增）的完整小程序系统，并提供微信小程序云开发函数与本地模拟适配层。

**Architecture:** 
- 前端视图层：基于 Uni-app 标准规范，配置 TabBar 及二级页面路由，采用模块化 Vue 3 组合式 API + TypeScript。
- 状态与业务层：封装 `cart` 响应式购物车 Store、`dish` 菜品数据服务、`order` 订单管理服务，统一接入 `cloud-adapter` 云开发/本地存储适配通道。
- 云端支撑层：在 `cloudfunctions/` 下提供 `dish-service`、`order-service`、`admin-service` 云函数源码与集合初始数据。

**Tech Stack:** Uni-app, Vue 3, TypeScript, Vite, SCSS, 微信小程序云开发 (CloudBase)

**Spec:** `docs/superpowers/specs/2026-10-12-mini-kitchen-design.md`

## Global Constraints
- 前端技术栈锁定为 Vue 3 + TypeScript + Vite + Uni-app。
- 遵循严谨类型定义，杜绝 `any`，运行 `pnpm type-check` 必须零报错。
- 视觉风格紧密贴合 `origin/` 中的 5 张原型图，配色选用暖橙红与温润白底，兼顾小屏与大屏一人食精致排版。
- 云开发模块必须具备无缝本地 Mock 降级支持，确保本地运行与演示零门槛。

---

### Task 1: 核心类型定义与云开发/本地存储适配层 (Data Models & Cloud Adapter)

**Files:**
- Create: `src/types/dish.ts`
- Create: `src/types/order.ts`
- Create: `src/types/admin.ts`
- Create: `src/services/mock-data.ts`
- Create: `src/services/cloud-adapter.ts`

**Interfaces:**
- Produces:
  - `Dish`, `DishPortion`, `DishTopping`, `DishCategory` (in `src/types/dish.ts`)
  - `CartItem`, `Order`, `OrderStatus` (in `src/types/order.ts`)
  - `cloudAdapter`: `{ getDishes, getDishDetail, saveDish, toggleDishStatus, deleteDish, getCategories, createOrder, getOrders, getSalesStats, verifyAdmin }`

- [ ] **Step 1: 创建 TypeScript 核心数据类型声明**
编写 `src/types/dish.ts`、`src/types/order.ts`、`src/types/admin.ts`。

- [ ] **Step 2: 创建初始菜品与分类 Mock 数据**
在 `src/services/mock-data.ts` 录入原型图中的番茄牛腩饭（标准份/小份、加卤蛋/加青菜/加肥牛）、虾仁滑蛋饭、菌菇鸡汤、黑椒牛柳面等初始数据。

- [ ] **Step 3: 实现云开发与本地存储无缝适配服务**
在 `src/services/cloud-adapter.ts` 封装底层 API，如果运行环境未初始化 `wx.cloud` 或在开发模式，自动从 `uni.getStorageSync` / `mock-data` 读取并持久化；若已开通 `wx.cloud` 则透传调用云函数。

- [ ] **Step 4: 运行类型检查验证**
运行 `pnpm type-check` 确保接口与适配器无类型错误。

- [ ] **Step 5: 提交代码**
```bash
git add src/types/ src/services/
git commit -m "feat: add domain types, mock seed data and cloud adapter"
```

---

### Task 2: 购物车与订单状态管理 (Cart Store & State Management)

**Files:**
- Create: `src/store/cart.ts`
- Create: `src/store/admin.ts`
- Test/Verify: `src/store/cart.spec.ts` (或简易断言脚本)

**Interfaces:**
- Consumes: `Dish`, `CartItem`, `DishPortion`, `DishTopping`
- Produces:
  - `useCartStore`: `{ cartItems, totalCount, totalAmount, addToCart, updateQuantity, removeFromCart, clearCart, remark }`
  - `useAdminStore`: `{ isAdmin, loginAdmin, logoutAdmin }`

- [ ] **Step 1: 编写购物车响应式状态管理**
在 `src/store/cart.ts` 实现根据菜品 ID、选中的规格（小份/标准份）和所选加料生成唯一规格指纹（specKey），正确累加件数与金额，提供持久化缓存。

- [ ] **Step 2: 编写管理员身份状态管理**
在 `src/store/admin.ts` 提供管理员鉴权状态维持与密码/凭据校验逻辑。

- [ ] **Step 3: 运行类型校验**
运行 `pnpm type-check`。

- [ ] **Step 4: 提交代码**
```bash
git add src/store/
git commit -m "feat: implement cart and admin store"
```

---

### Task 3: 路由体系与页面框架配置 (Pages & TabBar Routing)

**Files:**
- Modify: `src/pages.json`
- Create: `src/pages/detail/detail.vue`
- Create: `src/pages/cart/cart.vue`
- Create: `src/pages/order/order.vue`
- Create: `src/pages/mine/mine.vue`
- Create: `src/pages/admin/dishes.vue`
- Create: `src/pages/admin/dish-edit.vue`

**Interfaces:**
- Produces: 4 个底部 Tab 页面以及菜品详情与管理端路由入口。

- [ ] **Step 1: 配置 `src/pages.json`**
配置 4 个 TabBar 页面：`pages/index/index`、`pages/cart/cart`、`pages/order/order`、`pages/mine/mine`，并配置全局导航栏样式与图标。添加分包或页面路由 `pages/detail/detail`、`pages/admin/dishes`、`pages/admin/dish-edit`。

- [ ] **Step 2: 创建各页面初始框架模板**
创建 6 个页面的 Vue 3 SFC 骨架。

- [ ] **Step 3: 验证编译与路由构建**
运行 `pnpm type-check`。

- [ ] **Step 4: 提交代码**
```bash
git add src/pages.json src/pages/
git commit -m "feat: configure pages and tabbar routes"
```

---

### Task 4: 首页点餐台界面与交互开发 (Home Menu Page)

**Files:**
- Modify: `src/pages/index/index.vue`
- Create: `src/components/DishCard.vue`
- Create: `src/components/MiniCartBar.vue`

**Interfaces:**
- Consumes: `cloudAdapter.getDishes`, `cloudAdapter.getCategories`, `useCartStore`
- Produces: 原型图 1:1 还原的点餐台。

- [ ] **Step 1: 编写菜品展示卡片组件 `DishCard.vue`**
展示图片、标签（招牌/现做）、菜名、一人食介绍、月销量、价格、选规格/加购按钮。

- [ ] **Step 2: 编写底部悬浮迷你购物车栏 `MiniCartBar.vue`**
显示已选件数、总金额与【去结算】按钮，点击跳转购物车。

- [ ] **Step 3: 实现首页列表、分类切换与搜索**
在 `src/pages/index/index.vue` 实现品牌标语、搜索过滤、横向滚动分类 Tab、菜品列表联动与迷你购物车浮条。右上角保留直通管理后台入口。

- [ ] **Step 4: 运行类型校验**
运行 `pnpm type-check`。

- [ ] **Step 5: 提交代码**
```bash
git add src/pages/index/index.vue src/components/
git commit -m "feat: implement home menu page and components"
```

---

### Task 5: 菜品详情与选规格加料开发 (Dish Detail & Portion/Toppings)

**Files:**
- Modify: `src/pages/detail/detail.vue`

**Interfaces:**
- Consumes: `cloudAdapter.getDishDetail`, `useCartStore`
- Produces: 还原原型图 (1) 的规格加料选择与金额实时计算。

- [ ] **Step 1: 实现详情页大图与菜品信息**
包含菜品头图、标签（招牌、现做）、4.8 评分与月售数据。

- [ ] **Step 2: 实现份量选择与配料加料多选交互**
单选份量（标准份/小份），多选加料（加卤蛋/加青菜/加肥牛），底部带数量增减步进器与动态小计。

- [ ] **Step 3: 接入加入购物车与立即结算**
点击后更新 CartStore 并反馈轻提示（Toast），支持直接跳到购物车。

- [ ] **Step 4: 验证编译与类型**
运行 `pnpm type-check`。

- [ ] **Step 5: 提交代码**
```bash
git add src/pages/detail/detail.vue
git commit -m "feat: implement dish detail with portions and toppings"
```

---

### Task 6: 购物车与订单结算开发 (Cart Page & Checkout)

**Files:**
- Modify: `src/pages/cart/cart.vue`
- Modify: `src/pages/order/order.vue`

**Interfaces:**
- Consumes: `useCartStore`, `cloudAdapter.createOrder`, `cloudAdapter.getOrders`
- Produces: 原型图 (2) 的购物车页面及下单追踪。

- [ ] **Step 1: 实现购物车商品列表与管理**
支持菜品规格标签展示、数量调整、一键清空/删除，以及右上角【管理】切换。

- [ ] **Step 2: 实现整单备注与结算交互**
输入口味、忌口、配送时间备注，点击结算调用 `cloudAdapter.createOrder` 完成下单并清空购物车。

- [ ] **Step 3: 实现订单列表页面展示**
在 `pages/order/order.vue` 展示制作中、配送中等不同状态的订单卡片与历史账单。

- [ ] **Step 4: 验证编译与类型**
运行 `pnpm type-check`。

- [ ] **Step 5: 提交代码**
```bash
git add src/pages/cart/cart.vue src/pages/order/order.vue
git commit -m "feat: implement cart and order pages"
```

---

### Task 7: 菜品管理后台（看板/上下架/编辑新增）开发 (Admin Center)

**Files:**
- Modify: `src/pages/admin/dishes.vue`
- Modify: `src/pages/admin/dish-edit.vue`
- Modify: `src/pages/mine/mine.vue`

**Interfaces:**
- Consumes: `cloudAdapter.getSalesStats`, `cloudAdapter.toggleDishStatus`, `cloudAdapter.saveDish`, `cloudAdapter.deleteDish`
- Produces: 原型图 (3) 与原型图 (4) 的管理后台和编辑界面。

- [ ] **Step 1: 实现个人中心与管理员入口**
在 `pages/mine/mine.vue` 提供用户资料卡片与管理员入口（支持凭据弹窗核验）。

- [ ] **Step 2: 实现菜品管理后台 (`pages/admin/dishes.vue`)**
展示顶部看板（在售数量、售罄数量、今日销量）、在售/售罄分类过滤、菜品列表、以及在售/售罄一键切换按钮与【新增】按钮。

- [ ] **Step 3: 实现菜品编辑与新增 (`pages/admin/dish-edit.vue`)**
实现菜品图片选择/上传、菜名输入、分类下拉、价格数字输入、多行描述输入、保存修改与删除菜品操作。

- [ ] **Step 4: 验证类型与交互流程**
运行 `pnpm type-check`。

- [ ] **Step 5: 提交代码**
```bash
git add src/pages/admin/ src/pages/mine/mine.vue
git commit -m "feat: implement admin dashboard and dish edit"
```

---

### Task 8: 微信小程序云开发云函数与部署支撑 (Cloud Functions)

**Files:**
- Create: `cloudfunctions/dish-service/index.js`
- Create: `cloudfunctions/dish-service/package.json`
- Create: `cloudfunctions/order-service/index.js`
- Create: `cloudfunctions/order-service/package.json`
- Create: `cloudfunctions/admin-service/index.js`
- Create: `cloudfunctions/admin-service/package.json`
- Create: `project.config.json` (指定 `cloudfunctionRoot`)

**Interfaces:**
- Produces: 官方规范的云函数服务与环境配置，支持小程序开发者工具一键右键上传部署。

- [ ] **Step 1: 编写 `dish-service` 云函数**
处理菜品列表多维查询、保存、删除、状态修改。

- [ ] **Step 2: 编写 `order-service` 云函数**
处理订单落库、状态查询、今日统计数据聚合计算。

- [ ] **Step 3: 编写 `admin-service` 云函数**
处理管理员鉴权。

- [ ] **Step 4: 配置小程序项目云开发根目录**
在 `project.config.json` 中配置 `"cloudfunctionRoot": "cloudfunctions/"`。

- [ ] **Step 5: 提交代码**
```bash
git add cloudfunctions/ project.config.json
git commit -m "feat: add wechat cloudbase functions for dish, order, and admin"
```

---

### Task 9: 全局集成验证、视觉打磨与自测 (Full Integration & Verification)

- [ ] **Step 1: 全局类型校验**
运行 `pnpm type-check`。

- [ ] **Step 2: 全流程交互联调与验证**
验证菜品查询、选规格、加购物车、备注下单、订单记录查看、进入管理后台、切换在售/售罄、修改菜品并在首页即时生效。

- [ ] **Step 3: 最终提交**
```bash
git commit -m "chore: complete mini-kitchen mini program implementation"
```
