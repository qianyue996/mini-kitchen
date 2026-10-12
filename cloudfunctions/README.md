# 迷你小厨房 (Mini-Kitchen) 微信云开发云函数指南

本项目基于微信小程序云开发（WeChat CloudBase）构建后端能力，提供菜品管理、订单流转及管理员鉴权等云函数服务。
支持在微信开发者工具中一键右键上传并部署。

---

## 1. 目录结构

```text
cloudfunctions/
├── dish-service/          # 菜品与分类服务
│   ├── index.js
│   └── package.json
├── order-service/         # 订单流转与数据看板统计
│   ├── index.js
│   └── package.json
├── admin-service/         # 管理员身份验证与白名单校验
│   ├── index.js
│   └── package.json
├── test.js                # 云函数单元自动化测试脚本
└── README.md              # 部署与初始化文档
```

---

## 2. 数据库集合（Collections）创建规范

在微信开发者工具 -> **云开发控制台** -> **数据库** 中，创建以下 4 个集合：

| 集合名称 (`Collection`) | 用途 | 推荐访问权限规则 |
| :--- | :--- | :--- |
| `dishes` | 菜品信息表（名称、价格、规格、加料、在售状态等） | 所有用户可读，仅管理端/云函数可写 |
| `categories` | 菜品分类表（招牌、减脂餐、面食、汤品等） | 所有用户可读，仅管理端/云函数可写 |
| `orders` | 订单流转表（包含菜品明细、总价、用户openid、状态） | 仅创建者可读写，云函数端可全局管理 |
| `admins` | 管理员配置表（口令、OpenID 白名单） | 仅管理端/云函数可读写 |

---

## 3. 初始基础数据（Seed Data）

可在微信开发者工具云开发控制台通过 **导入 JSON** 快速初始化基础数据：

### 3.1 菜品分类 `categories`
```json
[
  { "_id": "cat_01", "name": "招牌", "sortOrder": 1 },
  { "_id": "cat_02", "name": "减脂餐", "sortOrder": 2 },
  { "_id": "cat_03", "name": "面食", "sortOrder": 3 },
  { "_id": "cat_04", "name": "汤品", "sortOrder": 4 },
  { "_id": "cat_05", "name": "饮品", "sortOrder": 5 }
]
```

### 3.2 推荐菜品 `dishes`
```json
[
  {
    "_id": "dish_001",
    "name": "番茄牛腩饭",
    "category": "招牌",
    "price": 28,
    "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    "description": "浓郁番茄汁，软烂牛腩，搭配米饭刚好一人食",
    "monthlySales": 128,
    "rating": 4.8,
    "status": "on_sale",
    "portions": [
      { "name": "标准份", "priceOffset": 0, "isDefault": true },
      { "name": "小份", "priceOffset": -4, "isDefault": false }
    ],
    "toppings": [
      { "name": "加卤蛋", "price": 4 },
      { "name": "加青菜", "price": 3 },
      { "name": "加肥牛", "price": 8 }
    ],
    "createTime": 1776000000000,
    "updateTime": 1776000000000
  },
  {
    "_id": "dish_002",
    "name": "虾仁滑蛋饭",
    "category": "招牌",
    "price": 26,
    "image": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
    "description": "鲜嫩高蛋白大虾仁与滑嫩温润鸡蛋，少油健康",
    "monthlySales": 96,
    "rating": 4.8,
    "status": "on_sale",
    "portions": [
      { "name": "标准份", "priceOffset": 0, "isDefault": true },
      { "name": "小份", "priceOffset": -4, "isDefault": false }
    ],
    "toppings": [
      { "name": "加卤蛋", "price": 4 },
      { "name": "加青菜", "price": 3 },
      { "name": "加肥牛", "price": 8 }
    ],
    "createTime": 1776000000000,
    "updateTime": 1776000000000
  },
  {
    "_id": "dish_003",
    "name": "菌菇鸡汤",
    "category": "汤品",
    "price": 22,
    "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80",
    "description": "严选老鸡与多种山珍菌菇文火慢炖，鲜美醇香",
    "monthlySales": 64,
    "rating": 4.8,
    "status": "on_sale",
    "portions": [
      { "name": "标准份", "priceOffset": 0, "isDefault": true },
      { "name": "小份", "priceOffset": -4, "isDefault": false }
    ],
    "toppings": [
      { "name": "加卤蛋", "price": 4 },
      { "name": "加青菜", "price": 3 },
      { "name": "加肥牛", "price": 8 }
    ],
    "createTime": 1776000000000,
    "updateTime": 1776000000000
  },
  {
    "_id": "dish_004",
    "name": "黑椒牛柳面",
    "category": "面食",
    "price": 25,
    "image": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
    "description": "现炒精选牛柳裹挟香浓黑椒汁，面条劲道爽滑",
    "monthlySales": 112,
    "rating": 4.8,
    "status": "on_sale",
    "portions": [
      { "name": "标准份", "priceOffset": 0, "isDefault": true },
      { "name": "小份", "priceOffset": -4, "isDefault": false }
    ],
    "toppings": [
      { "name": "加卤蛋", "price": 4 },
      { "name": "加青菜", "price": 3 },
      { "name": "加肥牛", "price": 8 }
    ],
    "createTime": 1776000000000,
    "updateTime": 1776000000000
  }
]
```

### 3.3 管理员配置 `admins`
```json
[
  {
    "_id": "admin_config",
    "passcode": "888888",
    "whitelistedOpenids": []
  }
]
```

---

## 4. 部署步骤（微信开发者工具）

1. **配置云开发环境 ID**：
   在微信开发者工具中，打开云开发控制台，获取环境 ID（例如 `mini-kitchen-xxxxxx`）。
   可在小程序初始化代码中绑定环境（如 `wx.cloud.init({ env: 'mini-kitchen-xxxxxx', traceUser: true })`）。

2. **上传并部署云函数**：
   在微信开发者工具的项目资源管理器中，展开 `cloudfunctions` 文件夹：
   - 右键 `dish-service` -> 选择 **“上传并部署：云端安装依赖 (不上传 node_modules)”**
   - 右键 `order-service` -> 选择 **“上传并部署：云端安装依赖 (不上传 node_modules)”**
   - 右键 `admin-service` -> 选择 **“上传并部署：云端安装依赖 (不上传 node_modules)”**

3. **本地开发环境降级能力说明**：
   本项目的前端 `cloudAdapter`（`src/services/cloud-adapter.ts`）内置全自动双模回退机制：
   - 当在真实微信小程序环境且检测到云函数已部署时，自动走云函数与云数据库交互；
   - 当未接入云开发或离线调试（如 H5 预览、本地 mock）时，自动无缝回退至本地内存与 Storage 模拟持久化，所有操作与状态流转均可正常体验。

---

## 5. 本地自动化测试

项目根目录下执行以下命令即可对云函数所有 action 逻辑进行自动化断言测试：

```bash
node cloudfunctions/test.js
```
