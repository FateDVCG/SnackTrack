const orderModel = require("../models/orderModel");
const messengerAPI = require("../utils/messengerAPI");

/**
 * Creates a new order from a Messenger message
 * @param {Object} messageData - Parsed message data
 * @returns {Promise<Object>} Created order
 */
async function createOrderFromMessage(messageData) {
  try {
    // For now, we'll create a simple order from the message
    // This will be expanded later to handle proper order flow
    const orderData = {
      customerId: messageData.senderId,
      status: "new",
      type: "Delivery", // Default type for Messenger orders
      totalPrice: 0, // Will be calculated based on items
      items: [
        {
          type: "message",
          content: messageData.text || messageData.payload,
        },
      ],
      specialInstructions: "",
    };

    const order = await orderModel.createOrder(orderData);

    // Send confirmation to customer
    await messengerAPI.sendTextMessage(
      messageData.senderId,
      `Thank you! Your order #${order.id} has been received and is being processed.`
    );

    return order;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

/**
 * Gets all orders with optional filters
 * @param {Object} filters - Optional filters (status, customerId, dateRange)
 * @returns {Promise<Array>} Array of orders
 */
async function getOrders(filters = {}) {
  try {
    return await orderModel.getOrders(filters);
  } catch (error) {
    console.error("Error getting orders:", error);
    throw error;
  }
}

/**
 * Updates an order's status and notifies the customer
 * @param {string} orderId - ID of the order to update
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated order
 */
async function updateOrderStatus(orderId, status) {
  try {
    const order = await orderModel.updateOrderStatus(orderId, status);

    // Send status update to customer
    const statusMessages = {
      accepted: "Your order has been accepted and is being prepared!",
      finished: "Your order is made and will be delivered shortly.",
      completed:
        "Your order has been completed. Thank you for ordering with us!",
      voided:
        "Your order has been voided. Please contact us if you have any questions.",
    };

    if (statusMessages[status]) {
      await messengerAPI.sendTextMessage(
        order.customer_id,
        `Order #${order.id} Update: ${statusMessages[status]}`
      );
    }

    return order;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
}

/**
 * Gets an order by ID
 * @param {string} orderId - ID of the order to fetch
 * @returns {Promise<Object>} Order object
 */
async function getOrderById(orderId) {
  try {
    return await orderModel.getOrderById(orderId);
  } catch (error) {
    console.error("Error getting order:", error);
    throw error;
  }
}

module.exports = {
  createOrderFromMessage,
  getOrders,
  updateOrderStatus,
  getOrderById,
};
