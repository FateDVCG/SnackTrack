const { Pool } = require("pg");

// Create a new pool using the connection string from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true,
  },
});

/**
 * Creates a new order in the database
 * @param {Object} orderData - Order data including customer info and items
 * @returns {Promise<Object>} Created order
 */
async function createOrder(orderData) {
  const {
    customerId,
    customerName,
    customerPhone,
    status,
    order_type,
    totalPrice,
    items,
    deliveryAddress,
    specialInstructions,
  } = orderData;

  const query = `
    INSERT INTO orders (
      customer_id,
      customer_name,
      customer_phone,
      status,
      order_type,
      total_price,
      items,
      delivery_address,
      special_instructions
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const values = [
    customerId,
    customerName || "Anonymous Customer",
    customerPhone || null,
    status,
    order_type,
    totalPrice,
    JSON.stringify(items),
    deliveryAddress || null,
    specialInstructions || null,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Gets all orders with optional filters
 * @param {Object} filters - Optional filters (status, customerId, customerName, dateRange)
 * @returns {Promise<Array>} Array of orders
 */
async function getOrders(filters = {}) {
  const conditions = [];
  const values = [];
  let paramCount = 1;

  if (filters.status) {
    conditions.push(`status = $${paramCount}`);
    values.push(filters.status);
    paramCount++;
  }

  if (filters.customerId) {
    conditions.push(`customer_id = $${paramCount}`);
    values.push(filters.customerId);
    paramCount++;
  }

  if (filters.customerName) {
    conditions.push(`LOWER(customer_name) LIKE LOWER($${paramCount})`);
    values.push(`%${filters.customerName}%`);
    paramCount++;
  }

  if (filters.customerPhone) {
    conditions.push(`customer_phone = $${paramCount}`);
    values.push(filters.customerPhone);
    paramCount++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT * FROM orders
    ${whereClause}
    ORDER BY created_at DESC
  `;

  const { rows } = await pool.query(query, values);
  return rows;
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
    SET status = $1
    WHERE id = $2
    RETURNING *
  `;

  const { rows } = await pool.query(query, [status, orderId]);
  return rows[0];
}

/**
 * Gets an order by ID
 * @param {string} orderId - ID of the order to fetch
 * @returns {Promise<Object>} Order object
 */
async function getOrderById(orderId) {
  const query = "SELECT * FROM orders WHERE id = $1";
  const { rows } = await pool.query(query, [orderId]);
  return rows[0];
}

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderById,
};
