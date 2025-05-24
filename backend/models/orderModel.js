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
  // Defensive checks for required fields
  if (
    !orderData ||
    !orderData.items ||
    !Array.isArray(orderData.items) ||
    orderData.items.length === 0
  ) {
    throw new Error("Order must contain at least one item");
  }
  if (!orderData.status) {
    throw new Error("Order status is required");
  }
  if (orderData.totalPrice == null || isNaN(orderData.totalPrice)) {
    throw new Error("Order totalPrice is required and must be a number");
  }

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
  if (!orderId || isNaN(Number(orderId))) {
    throw new Error("Order ID must be a valid number");
  }
  // Validate status
  const validStatuses = ["new", "accepted", "finished", "completed", "voided"];
  if (!validStatuses.includes(status)) {
    throw new Error(
      `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`
    );
  }

  // Get current order to validate status transition
  const currentOrder = await getOrderById(orderId);
  if (!currentOrder) {
    throw new Error(`Order with ID ${orderId} not found`);
  }

  // Define valid status transitions
  const validTransitions = {
    new: ["accepted", "voided"],
    accepted: ["finished", "voided"],
    finished: ["completed", "voided"],
    completed: [], // Terminal state, no further transitions
    voided: [], // Terminal state, no further transitions
    // For backward compatibility with tests that use "pending" status
    pending: ["accepted", "voided"],
  };

  // Check if the transition is valid
  if (
    currentOrder.status &&
    validTransitions[currentOrder.status] &&
    !validTransitions[currentOrder.status].includes(status)
  ) {
    throw new Error(
      `Invalid status transition: Cannot change from ${currentOrder.status} to ${status}`
    );
  }

  const query = `
    UPDATE orders
    SET status = $1
    WHERE id = $2
    RETURNING *
  `;

  const { rows } = await pool.query(query, [status, orderId]);

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

/**
 * Gets an order by ID
 * @param {string} orderId - ID of the order to fetch
 * @returns {Promise<Object>} Order object
 */
async function getOrderById(orderId) {
  if (!orderId || isNaN(Number(orderId))) {
    throw new Error("Order ID must be a valid number");
  }
  const query = "SELECT * FROM orders WHERE id = $1";
  const { rows } = await pool.query(query, [orderId]);
  return rows[0];
}

// NOTE: Ensure you have run the migration 004_add_customer_name.sql on your real database.
// NOTE: Ensure your DATABASE_URL environment variable is set and includes a password.

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  getOrderById,
};
