const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * Dish service cloud function entry
 * @param {Object} event
 * @param {string} event.action - action name
 */
exports.main = async (event, context) => {
  const { action } = event;

  try {
    switch (action) {
      case 'getDishes': {
        const query = {};
        if (event.category && event.category !== '全部') {
          query.category = event.category;
        }
        if (event.status) {
          query.status = event.status;
        }
        if (event.keyword && typeof event.keyword === 'string' && event.keyword.trim()) {
          const kw = event.keyword.trim();
          query.name = db.RegExp({
            regexp: kw,
            options: 'i'
          });
        }

        const res = await db.collection('dishes').where(query).get();
        return {
          success: true,
          data: res.data || []
        };
      }

      case 'getDishDetail': {
        const { id } = event;
        if (!id) {
          return { success: false, error: 'Missing dish id' };
        }
        try {
          const res = await db.collection('dishes').doc(id).get();
          return {
            success: true,
            data: res.data || null
          };
        } catch (err) {
          return {
            success: true,
            data: null
          };
        }
      }

      case 'saveDish': {
        const dishData = event.dish || event;
        const now = Date.now();

        if (dishData._id) {
          const updatePayload = {
            ...dishData,
            updateTime: now
          };
          delete updatePayload.action;
          delete updatePayload.dish;
          delete updatePayload._id;

          try {
            await db.collection('dishes').doc(dishData._id).update({
              data: updatePayload
            });
            const updated = await db.collection('dishes').doc(dishData._id).get();
            return {
              success: true,
              data: updated.data
            };
          } catch (updateErr) {
            // Document might not exist yet, use set
            await db.collection('dishes').doc(dishData._id).set({
              data: {
                ...updatePayload,
                createTime: dishData.createTime || now
              }
            });
            return {
              success: true,
              data: {
                ...updatePayload,
                createTime: dishData.createTime || now
              }
            };
          }
        }

        const newDish = {
          name: dishData.name || '新建菜品',
          category: dishData.category || '招牌',
          price: typeof dishData.price === 'number' ? dishData.price : 20,
          image: dishData.image || '',
          description: dishData.description || '',
          monthlySales: dishData.monthlySales ?? 0,
          rating: dishData.rating ?? 4.8,
          status: dishData.status || 'on_sale',
          portions: dishData.portions || [],
          toppings: dishData.toppings || [],
          createTime: now,
          updateTime: now
        };

        const addRes = await db.collection('dishes').add({
          data: newDish
        });

        return {
          success: true,
          data: {
            _id: addRes._id,
            ...newDish
          }
        };
      }

      case 'updateDishStatus': {
        const { id, status } = event;
        if (!id) {
          return { success: false, error: 'Missing dish id' };
        }

        const targetDishRes = await db.collection('dishes').doc(id).get();
        if (!targetDishRes || !targetDishRes.data) {
          return { success: false, error: 'Dish not found' };
        }

        const newStatus = status || (targetDishRes.data.status === 'on_sale' ? 'sold_out' : 'on_sale');
        const now = Date.now();

        await db.collection('dishes').doc(id).update({
          data: {
            status: newStatus,
            updateTime: now
          }
        });

        return {
          success: true,
          data: {
            ...targetDishRes.data,
            status: newStatus,
            updateTime: now
          }
        };
      }

      case 'deleteDish': {
        const { id } = event;
        if (!id) {
          return { success: false, error: 'Missing dish id' };
        }

        await db.collection('dishes').doc(id).remove();
        return {
          success: true,
          data: true
        };
      }

      case 'getCategories': {
        const res = await db.collection('categories').orderBy('sortOrder', 'asc').get();
        return {
          success: true,
          data: res.data || []
        };
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}`
        };
    }
  } catch (err) {
    console.error(`[dish-service] Error handling action ${action}:`, err);
    return {
      success: false,
      error: err.message || String(err)
    };
  }
};
