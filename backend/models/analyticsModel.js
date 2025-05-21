const { Pool } = require("pg");

// Create a new pool using the connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true,
  },
});

/**
 * Gets sales analytics for a specific time range
 * @param {string} range - 'day', 'week', or 'month'
 * @returns {Promise<Object>} Analytics data
 */
async function getSalesAnalytics(range) {
  let intervalQuery;
  switch (range) {
    case "day":
      intervalQuery = "created_at >= CURRENT_DATE";
      break;
    case "week":
      intervalQuery = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
      break;
    case "month":
      intervalQuery = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
      break;
    default:
      throw new Error("Invalid range specified. Use day, week, or month.");
  }

  const query = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_price) as total_revenue,
      AVG(total_price) as average_order_value,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
    FROM orders 
    WHERE ${intervalQuery}
  `;

  try {
    const result = await pool.query(query);
    return result.rows[0];
  } catch (error) {
    console.error("Error getting sales analytics:", error);
    throw error;
  }
}

/**
 * Gets top selling items for a specific time range
 * @param {string} range - 'day', 'week', or 'month'
 * @param {number} limit - Number of items to return
 * @returns {Promise<Array>} Top selling items
 */
async function getTopSellingItems(range, limit = 5) {
  let intervalQuery;
  switch (range) {
    case "day":
      intervalQuery = "created_at >= CURRENT_DATE";
      break;
    case "week":
      intervalQuery = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
      break;
    case "month":
      intervalQuery = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
      break;
    default:
      throw new Error("Invalid range specified. Use day, week, or month.");
  }

  // This query assumes items are stored as a JSONB array in the orders table
  const query = `
    WITH RECURSIVE items AS (
      SELECT 
        jsonb_array_elements(items::jsonb) as item
      FROM orders 
      WHERE ${intervalQuery}
        AND status = 'completed'
    )
    SELECT 
      item->>'name' as item_name,
      COUNT(*) as quantity_sold,
      SUM((item->>'price')::numeric) as total_revenue
    FROM items
    GROUP BY item_name
    ORDER BY quantity_sold DESC
    LIMIT $1
  `;

  try {
    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error("Error getting top selling items:", error);
    throw error;
  }
}

/**
 * Gets hourly order distribution for a specific time range
 * @param {string} range - 'day', 'week', or 'month'
 * @returns {Promise<Array>} Hourly distribution data
 */
async function getHourlyDistribution(range) {
  let intervalQuery;
  switch (range) {
    case "day":
      intervalQuery = "created_at >= CURRENT_DATE";
      break;
    case "week":
      intervalQuery = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
      break;
    case "month":
      intervalQuery = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
      break;
    default:
      throw new Error("Invalid range specified. Use day, week, or month.");
  }

  const query = `
    SELECT 
      EXTRACT(HOUR FROM created_at) as hour,
      COUNT(*) as order_count
    FROM orders 
    WHERE ${intervalQuery}
    GROUP BY hour
    ORDER BY hour
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error getting hourly distribution:", error);
    throw error;
  }
}

module.exports = {
  getSalesAnalytics,
  getTopSellingItems,
  getHourlyDistribution,
};
