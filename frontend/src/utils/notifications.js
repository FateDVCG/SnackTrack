// Create notification sound
const notificationSound = new Audio("/notification.mp3");

export const notifications = {
  // Request permission for desktop notifications
  async requestPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  },

  // Play notification sound
  playSound() {
    notificationSound.play().catch((error) => {
      console.log("Error playing notification sound:", error);
    });
  },

  // Show desktop notification
  showNotification(title, options = {}) {
    if (Notification.permission === "granted") {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        ...options,
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  },

  // Handle new order notification
  async notifyNewOrder(order) {
    // Play sound
    this.playSound();

    // Show desktop notification
    this.showNotification("New Order Received!", {
      body: `Order #${order.id} - Total: $${order.total_price.toFixed(2)}`,
      tag: "new-order",
    });
  },

  // Handle order status change notification
  async notifyStatusChange(order) {
    this.showNotification("Order Status Updated", {
      body: `Order #${order.id} is now ${order.status}`,
      tag: "status-change",
    });
  },
};
