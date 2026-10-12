const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * Order service cloud function entry
 * @param {Object} event
 * @param {string} event.action - action name
 */
exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();

  try {
    switch (action) {
      case 'createOrder': {
        const orderData = event.order || event;
        const now = Date.now();

        const openid = wxContext.OPENID || orderData._openid || '';

        const newOrder = {
          _openid: openid,
          items: Array.isArray(orderData.items) ? orderData.items : [],
          totalAmount: typeof orderData.totalAmount === 'number' ? orderData.totalAmount : 0,
          remark: orderData.remark || '',
          status: orderData.status || 'cooking',
          createTime: now,
          updateTime: now
        };

        const addRes = await db.collection('orders').add({
          data: newOrder
        });

        return {
          success: true,
          data: {
            _id: addRes._id,
            ...newOrder
          }
        };
      }

      case 'getOrders': {
        const query = {};

        if (event.openid) {
          if (event.openid !== 'all' && !event.isAdmin) {
            query._openid = event.openid;
          }
        } else if (!event.isAdmin && wxContext.OPENID) {
          query._openid = wxContext.OPENID;
        }

        const res = await db.collection('orders')
          .where(query)
          .orderBy('createTime', 'desc')
          .get();

        return {
          success: true,
          data: res.data || []
        };
      }

      case 'getSalesStats': {
        // Aggregate on_sale count
        const onSaleRes = await db.collection('dishes').where({
          status: 'on_sale'
        }).count();

        // Aggregate sold_out count
        const soldOutRes = await db.collection('dishes').where({
          status: 'sold_out'
        }).count();

        // Aggregate today's sales
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartTime = todayStart.getTime();

        const todayOrdersRes = await db.collection('orders').where({
          createTime: _.gte(todayStartTime),
          status: _.neq('cancelled')
        }).get();

        const todayOrders = todayOrdersRes.data || [];
        let todaySalesCount = 0;
        let todaySalesAmount = 0;

        for (const order of todayOrders) {
          todaySalesAmount += (order.totalAmount || 0);
          if (Array.isArray(order.items)) {
            for (const item of order.items) {
              todaySalesCount += (item.quantity || 0);
            }
          }
        }

        return {
          success: true,
          data: {
            onSaleCount: onSaleRes.total || 0,
            soldOutCount: soldOutRes.total || 0,
            todaySalesCount,
            todaySalesAmount
          }
        };
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}`
        };
    }
  } catch (err) {
    console.error(`[order-service] Error handling action ${action}:`, err);
    return {
      success: false,
      error: err.message || String(err)
    };
  }
};
