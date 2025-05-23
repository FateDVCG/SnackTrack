// Simple notification utility that doesn't rely on browser storage
export const notifications = {
  // Simple check if notifications are supported
  isSupported() {
    return "Notification" in window;
  },

  // Request permission without storing state
  async requestPermission() {
    if (!this.isSupported()) {
      console.log("Notifications not supported");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  },

  // Show notification without storing state
  showNotification(title, options = {}) {
    if (!this.isSupported()) return;

    try {
      if (Notification.permission === "granted") {
        new Notification(title, options);
      }
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  },

  // Specific notification methods
  notifyNewOrder(order) {
    this.showNotification("New Order Received", {
      body: `Order #${order.id}\nTotal: ₱${order.total_price}`,
    });
  },

  notifyStatusChange(order) {
    this.showNotification("Order Status Updated", {
      body: `Order #${order.id} is now ${order.status}`,
    });
  },
};
