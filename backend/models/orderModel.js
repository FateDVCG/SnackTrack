const { Pool } = require("pg");

// Create a new pool using the connection string from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

/**
 * Creates a new order in the database
 * @param {Object} orderData - Order data including customer info and items
 * @returns {Promise<Object>} Created order
 */
async function createOrder(orderData) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderQuery = `
      INSERT INTO orders (
        customer_id,
        status,
        total_price,
        items,
        special_instructions,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    const orderValues = [
      orderData.customerId,
      orderData.status || "pending",
      orderData.totalPrice,
      JSON.stringify(orderData.items),
      orderData.specialInstructions,
    ];

    const result = await client.query(orderQuery, orderValues);
    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Gets orders from the database with optional filters
 * @param {Object} filters - Optional filters (status, customerId, dateRange)
 * @returns {Promise<Array>} Array of orders
 */
async function getOrders(filters = {}) {
  let query = "SELECT * FROM orders";
  const values = [];
  const conditions = [];

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }

  if (filters.customerId) {
    values.push(filters.customerId);
    conditions.push(`customer_id = $${values.length}`);
  }

  if (filters.dateRange) {
    values.push(filters.dateRange.start);
    values.push(filters.dateRange.end);
    conditions.push(
      `created_at BETWEEN $${values.length - 1} AND $${values.length}`
    );
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY created_at DESC";

  const result = await pool.query(query, values);
  return result.rows;
}

/**
 * Updates the status of an order
 * @param {string} orderId - ID of the order to update
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated order
 */
async function updateOrderStatus(orderId, status) {
  const query = `
    UPDATE orders 
    SET 
      status = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;

  const result = await pool.query(query, [status, orderId]);

  if (result.rows.length === 0) {
    throw new Error(`Order with ID ${orderId} not found`);
  }

  return result.rows[0];
}

/**
 * Gets a single order by ID
 * @param {string} orderId - ID of the order to fetch
 * @returns {Promise<Object>} Order details
 */
async function getOrderById(orderId) {
  const query = "SELECT * FROM orders WHERE id = $1";
  const result = await pool.query(query, [orderId]);

  if (result.rows.length === 0) {
    throw new Error(`Order with ID ${orderId} not found`);
  }

  return result.rows[0];
}

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderById,
};
