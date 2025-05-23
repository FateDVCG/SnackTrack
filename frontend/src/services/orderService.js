// Simple mock service for orders
// In a real app, this would make API calls to your backend

const mockOrders = [
  {
    id: 1,
    type: "Dine In",
    status: "new",
    table: "A1",
    items: [
      { name: "Burger", price: 120.99, quantity: 2 },
      { name: "Fries", price: 40.99, quantity: 1 },
    ],
    total_price: 282.97,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    type: "Delivery",
    status: "new",
    items: [
      { name: "Pizza", price: 150.99, quantity: 1 },
      { name: "Soda", price: 25.99, quantity: 2 },
    ],
    total_price: 202.97,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  },
];

export const orderService = {
  // Get all orders
  async getOrders() {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockOrders);
      }, 1000);
    });
  },

  // Update order status
  async updateOrderStatus(orderId, newStatus) {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const order = mockOrders.find((o) => o.id === orderId);
        if (!order) {
          reject(new Error(`Order ${orderId} not found`));
          return;
        }

        const updatedOrder = {
          ...order,
          status: newStatus,
        };

        // Update the mock data
        const index = mockOrders.findIndex((o) => o.id === orderId);
        mockOrders[index] = updatedOrder;

        // Simulate sending Messenger notification
        if (newStatus === "finished") {
          console.log(
            "Sending Messenger notification: Your order is made and will be delivered shortly."
          );
        }

        resolve(updatedOrder);
      }, 500);
    });
  },

  async createOrder(orderData) {
    // Set default type to "Delivery" for Messenger orders
    const order = {
      ...orderData,
      type: "Delivery",
      status: "new",
      id: mockOrders.length + 1,
      created_at: new Date().toISOString(),
    };

    mockOrders.push(order);
    return order;
  },

  // Convert currency (simplified mock implementation)
  convertCurrency(amount, from = "PHP", to = "USD") {
    // Mock exchange rate (1 USD = 50 PHP)
    const rate = from === "PHP" ? 0.02 : 50;
    return amount * rate;
  },
};
