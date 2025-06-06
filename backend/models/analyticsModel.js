const { Pool } = require("pg");
const pool = require("../config/db");

/**
 * Gets sales analytics for a specific time range
 * @param {Object} params - Parameters object
 * @param {string} params.range - 'day', 'week', or 'month'
 * @param {string} [params.startDate] - Optional start date in YYYY-MM-DD format
 * @param {string} [params.endDate] - Optional end date in YYYY-MM-DD format
 * @returns {Promise<Object>} Analytics data
 */
async function getSalesAnalytics({ range, startDate, endDate }) {
  let intervalQuery = "";
  let values = [];
  if (startDate && endDate) {
    intervalQuery = "created_at BETWEEN $1 AND $2";
    values = [startDate, endDate];
  } else {
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
        throw new Error(
          "Invalid range specified. Use day, week, or month, or provide startDate and endDate."
        );
    }
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
    const result = await pool.query(query, values);
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
async function getTopSellingItems({ range, startDate, endDate, limit = 5 }) {
  let intervalQuery = "";
  let values = [];
  if (startDate && endDate) {
    intervalQuery = "created_at BETWEEN $1 AND $2";
    values = [startDate, endDate];
  } else {
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
        throw new Error(
          "Invalid range specified. Use day, week, or month, or provide startDate and endDate."
        );
    }
  }

  // This query assumes items are stored as a JSONB array in the orders table
  const query = `
    WITH RECURSIVE items AS (
      SELECT 
        jsonb_array_elements(items::jsonb) as item
      FROM orders 
      WHERE ${intervalQuery}
        AND status IN ('completed', 'finished', 'accepted')
    )
    SELECT 
      item->>'name' as item_name,
      COUNT(*) as quantity_sold,
      SUM((item->>'price')::numeric) as total_revenue
    FROM items
    GROUP BY item_name
    ORDER BY quantity_sold DESC
    LIMIT $${values.length + 1}
  `;

  try {
    const result = await pool.query(query, [...values, limit]);
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

/**
 * Gets revenue over time for a specific range
 * @param {string} range - 'day', 'week', or 'month'
 * @returns {Promise<Array>} Revenue time series data
 */
// Accepts params: { range, startDate, endDate }
async function getRevenueOverTime({ range, startDate, endDate }) {
  let timeGroup = "";
  let intervalQuery = "";
  let values = [];
  if (startDate && endDate) {
    timeGroup = "DATE_TRUNC('day', created_at)";
    intervalQuery = "created_at BETWEEN $1 AND $2";
    values = [startDate, endDate];
  } else {
    switch (range) {
      case "day":
        timeGroup = "EXTRACT(HOUR FROM created_at)";
        intervalQuery = "created_at >= CURRENT_DATE";
        break;
      case "week":
        timeGroup = "EXTRACT(DOW FROM created_at)";
        intervalQuery = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case "month":
        timeGroup = "EXTRACT(DAY FROM created_at)";
        intervalQuery = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      default:
        throw new Error("Invalid range specified");
    }
  }

  const query = `
    SELECT 
      ${timeGroup} as time_unit,
      SUM(total_price) as revenue,
      COUNT(*) as count
    FROM orders 
    WHERE ${intervalQuery}
      AND status IN ('completed', 'finished', 'accepted')
    GROUP BY time_unit
    ORDER BY time_unit
  `;

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Error getting revenue over time:", error);
    throw error;
  }
}

/**
 * Gets orders by type with time distribution
 * @param {Object} params - { range, startDate, endDate }
 * @returns {Promise<Array>} Orders by type data
 */
async function getOrdersByType({ range, startDate, endDate }) {
  let timeGroup,
    intervalQuery,
    values = [];
  // Default to 'month' if no valid range or dates are provided
  if (!range && !(startDate && endDate)) {
    range = "month";
  }
  if (startDate && endDate) {
    // Use TO_CHAR to ensure time_unit is always text for custom range
    timeGroup = "TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD')";
    intervalQuery = "created_at BETWEEN $1 AND $2";
    values = [startDate, endDate];
  } else {
    switch (range) {
      case "day":
        timeGroup = "EXTRACT(HOUR FROM created_at)::text";
        intervalQuery = "created_at >= CURRENT_DATE";
        break;
      case "week":
        timeGroup = "EXTRACT(DOW FROM created_at)::text";
        intervalQuery = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case "month":
        timeGroup = "EXTRACT(DAY FROM created_at)::text";
        intervalQuery = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      default:
        throw new Error(
          "Invalid range specified. Use day, week, or month, or provide startDate and endDate."
        );
    }
  }

  const query = `
    WITH time_series AS (
      SELECT 
        order_type,
        ${timeGroup} as time_unit,
        COUNT(*) as count
      FROM orders 
      WHERE ${intervalQuery}
        AND status IN ('completed', 'finished', 'accepted')
      GROUP BY order_type, time_unit
    ),
    type_totals AS (
      SELECT 
        order_type,
        COUNT(*) as total_count
      FROM orders 
      WHERE ${intervalQuery}
        AND status IN ('completed', 'finished', 'accepted')
      GROUP BY order_type
    )
    SELECT 
      t.order_type as type,
      t.total_count as count,
      json_agg(
        json_build_object(
          'time_unit', COALESCE(ts.time_unit, '0'),
          'count', COALESCE(ts.count, 0)
        ) ORDER BY ts.time_unit
      ) as by_time
    FROM type_totals t
    LEFT JOIN time_series ts ON t.order_type = ts.order_type
    GROUP BY t.order_type, t.total_count
  `;

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Error getting orders by type:", error);
    throw error;
  }
}

module.exports = {
  getSalesAnalytics,
  getTopSellingItems,
  getHourlyDistribution,
  getRevenueOverTime,
  getOrdersByType,
};
