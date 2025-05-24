// Order service for making API calls to the backend
import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

export const orderService = {
  // Get all orders
  async getOrders() {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(orderId, newStatus) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/orders/${orderId}/status`,
        {
          status: newStatus,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  },

  // Create a new order
  async createOrder(orderData) {
    try {
      const data = {
        customerName: orderData.customerName || "Anonymous Customer",
        customerPhone: orderData.customerPhone,
        type: orderData.type || "Delivery",
        totalPrice: orderData.totalPrice,
        items: orderData.items,
        deliveryAddress: orderData.deliveryAddress,
        specialInstructions: orderData.specialInstructions,
      };

      const response = await axios.post(`${API_BASE_URL}/orders`, data);
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  // Convert currency (simplified mock implementation)
  convertCurrency(amount, from = "PHP", to = "USD") {
    // Mock exchange rate (1 USD = 50 PHP)
    const rate = from === "PHP" ? 0.02 : 50;
    return amount * rate;
  },
};
