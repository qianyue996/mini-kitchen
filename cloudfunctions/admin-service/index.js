const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

/**
 * Admin service cloud function entry
 * @param {Object} event
 * @param {string} event.action - action name
 */
exports.main = async (event, context) => {
  const { action } = event;
  const wxContext = cloud.getWXContext();

  try {
    switch (action) {
      case 'verifyAdmin': {
        const { passcode } = event;
        const callerOpenid = wxContext.OPENID;

        // 1. Direct passcode check with default system passcode
        if (passcode === '888888') {
          return {
            success: true,
            data: true
          };
        }

        // 2. Query admins collection for dynamic passcode or openid whitelist
        try {
          const adminsRes = await db.collection('admins').get();
          const adminConfigs = adminsRes.data || [];

          for (const config of adminConfigs) {
            // Check openid whitelist
            if (
              callerOpenid &&
              Array.isArray(config.whitelistedOpenids) &&
              config.whitelistedOpenids.includes(callerOpenid)
            ) {
              return {
                success: true,
                data: true
              };
            }

            // Check dynamic admin passcode
            if (passcode && config.passcode && passcode === config.passcode) {
              return {
                success: true,
                data: true
              };
            }
          }
        } catch (dbErr) {
          console.warn('[admin-service] Could not query admins collection, falling back to default passcode rule:', dbErr);
        }

        return {
          success: true,
          data: false
        };
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}`
        };
    }
  } catch (err) {
    console.error(`[admin-service] Error handling action ${action}:`, err);
    return {
      success: false,
      error: err.message || String(err)
    };
  }
};
