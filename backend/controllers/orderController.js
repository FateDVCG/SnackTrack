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

    return await orderModel.createOrder(transformedData);
  } catch (error) {
    console.error("Error in createOrder:", error);
    throw error;
  }
}

/**
 * Create an order from a parsed message
 */
async function createOrderFromMessage({ senderId, parsedOrder }) {
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
  return await orderModel.getOrders(filters);
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, status) {
  return await orderModel.updateOrderStatus(orderId, status);
}

/**
 * Get order by ID
 */
async function getOrderById(orderId) {
  return await orderModel.getOrderById(orderId);
}

module.exports = {
  createOrder,
  createOrderFromMessage,
  getOrders,
  updateOrderStatus,
  getOrderById,
  __set__messengerAPI,
};
