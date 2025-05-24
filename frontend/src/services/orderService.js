// Order service for making API calls to the backend

export const orderService = {
  // Get all orders
  async getOrders() {
    try {
      const response = await fetch("/api/orders");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch orders");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(orderId, newStatus) {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update order status");
      }

      return await response.json();
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

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create order");
      }

      return await response.json();
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
