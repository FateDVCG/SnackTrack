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
        type,
        total_price,
        items,
        special_instructions,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const orderValues = [
      orderData.customerId,
      orderData.status || "new",
      orderData.type || "Delivery",
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
 * Gets all orders with optional filters
 * @param {Object} filters - Optional filters (status, customerId, dateRange)
 * @returns {Promise<Array>} Array of orders
 */
async function getOrders(filters = {}) {
  let query = `
    SELECT * 
    FROM orders 
    WHERE 1=1
  `;
  const values = [];
  let valueIndex = 1;

  if (filters.status) {
    query += ` AND status = $${valueIndex}`;
    values.push(filters.status);
    valueIndex++;
  }

  if (filters.customerId) {
    query += ` AND customer_id = $${valueIndex}`;
    values.push(filters.customerId);
    valueIndex++;
  }

  if (filters.dateRange) {
    query += ` AND created_at >= $${valueIndex}`;
    values.push(filters.dateRange.start);
    valueIndex++;

    query += ` AND created_at <= $${valueIndex}`;
    values.push(filters.dateRange.end);
    valueIndex++;
  }

  query += " ORDER BY created_at DESC";

  const result = await pool.query(query, values);
  return result.rows;
}

/**
 * Updates the status of an order
 * @param {string} orderId - ID of the order to update
 * @param {string} status - New status (new, accepted, finished, completed, voided)
 * @returns {Promise<Object>} Updated order
 */
async function updateOrderStatus(orderId, status) {
  // Validate status
  const validStatuses = ["new", "accepted", "finished", "completed", "voided"];
  if (!validStatuses.includes(status)) {
    throw new Error(
      `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`
    );
  }

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
 * Gets an order by ID
 * @param {string} orderId - ID of the order to fetch
 * @returns {Promise<Object>} Order object
 */
async function getOrderById(orderId) {
  const query = `
    SELECT * 
    FROM orders 
    WHERE id = $1
  `;

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
