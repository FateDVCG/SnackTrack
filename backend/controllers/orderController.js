const orderModel = require("../models/orderModel");
let messengerAPI = require("../utils/messengerAPI");

/**
 * Set messenger API implementation (for testing)
 */
function __set__messengerAPI(mockAPI) {
  messengerAPI = mockAPI;
}

/**
 * Create a new order
 */
async function createOrder(orderData) {
  try {
    if (
      !orderData.items ||
      !Array.isArray(orderData.items) ||
      orderData.items.length === 0
    ) {
      throw new Error("Order must contain at least one item");
    }
    if (orderData.totalPrice == null || isNaN(orderData.totalPrice)) {
      throw new Error("Total price is required and must be a number");
    }
    if (!orderData.customerName) {
      throw new Error("Customer name is required");
    }

    // Transform the data to match database schema
    const transformedData = {
      customerId: orderData.customerPhone, // Use phone as customer ID for manual orders
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      status: "new",
      order_type: orderData.type || "Delivery",
      totalPrice: parseFloat(orderData.totalPrice),
      items: orderData.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity),
      })),
      deliveryAddress: orderData.deliveryAddress,
      specialInstructions: orderData.specialInstructions,
    };

    const order = await orderModel.createOrder(transformedData);
    if (!order) {
      throw new Error("Failed to create order");
    }
    return order;
  } catch (error) {
    console.error("Error in createOrder:", error);
    // Add context to the error
    if (error.message.includes("violates foreign key constraint")) {
      throw new Error("One or more items in the order do not exist");
    }
    throw error;
  }
}

/**
 * Create an order from a parsed message
 */
async function createOrderFromMessage({ senderId, parsedOrder }) {
  if (!senderId) throw new Error("Sender ID is required");
  if (
    !parsedOrder ||
    !Array.isArray(parsedOrder.items) ||
    parsedOrder.items.length === 0
  ) {
    throw new Error("Parsed order must contain at least one item");
  }

  const orderData = {
    customerId: senderId,
    customerName: parsedOrder.customerName || "Messenger Customer",
    customerPhone: parsedOrder.customerPhone,
    status: "new",
    order_type: "Messenger",
    totalPrice: calculateTotal(parsedOrder.items),
    items: parsedOrder.items,
    deliveryAddress: parsedOrder.address,
    specialInstructions: parsedOrder.specialInstructions,
  };

  const order = await orderModel.createOrder(orderData);

  // Format items for confirmation message
  const itemsList = parsedOrder.items
    .map(
      ({ item, quantity }) =>
        `${quantity}x ${item.name} (₱${item.price * quantity})`
    )
    .join("\n");

  // Send detailed confirmation to customer
  const confirmationMessage =
    `Thank you${
      orderData.customerName ? " " + orderData.customerName : ""
    }! Your order #${order.id} has been received:\n\n` +
    `${itemsList}\n\n` +
    `Total: ₱${orderData.totalPrice}\n` +
    `Delivery Address: ${parsedOrder.address || "Not provided"}\n\n` +
    `We'll process your order shortly.`;

  await messengerAPI.sendTextMessage(senderId, confirmationMessage);

  return order;
}

/**
 * Calculate total price from items
 */
function calculateTotal(items) {
  const total = items.reduce((total, { item, quantity }) => {
    return total + item.price * quantity;
  }, 0);

  // Round to 2 decimal places to avoid floating point issues
  return Math.round(total * 100) / 100;
}

/**
 * Get filtered orders
 */
async function getOrders(filters = {}) {
  try {
    const orders = await orderModel.getOrders(filters);
    if (!orders) {
      throw new Error("Failed to fetch orders");
    }
    return orders;
  } catch (error) {
    console.error("Error in getOrders:", error);
    throw error;
  }
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, status) {
  try {
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // First check if order exists
    const existingOrder = await orderModel.getOrderById(orderId);
    if (!existingOrder) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const order = await orderModel.updateOrderStatus(orderId, status);
    if (!order) {
      throw new Error("Failed to update order status");
    }
    return order;
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    // Add context to the error
    if (error.message.includes("Invalid status transition")) {
      throw error; // Pass the transition error message through
    }
    if (error.message.includes("Invalid status")) {
      throw new Error(
        `Invalid status: ${status}. Valid statuses are: new, accepted, finished, completed, voided`
      );
    }
    throw error;
  }
}

/**
 * Get order by ID
 */
async function getOrderById(orderId) {
  try {
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    const order = await orderModel.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    return order;
  } catch (error) {
    console.error("Error in getOrderById:", error);
    throw error;
  }
}

// NOTE: Ensure you have run the migration 004_add_customer_name.sql on your real database.
// NOTE: Ensure your DATABASE_URL environment variable is set and includes a password.

module.exports = {
  createOrder,
  createOrderFromMessage,
  getOrders,
  updateOrderStatus,
  getOrderById,
  __set__messengerAPI,
};
