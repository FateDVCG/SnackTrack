import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import NotificationSystem from "../notifications";

describe("NotificationSystem", () => {
  let notificationSystem;
  let mockAudio;

  beforeEach(() => {
    // Mock Audio API
    mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      load: vi.fn(),
    };
    global.Audio = vi.fn(() => mockAudio);

    // Mock Notification API
    global.Notification = {
      requestPermission: vi.fn().mockResolvedValue("granted"),
      permission: "granted",
    };
    global.Notification.prototype.close = vi.fn();

    notificationSystem = new NotificationSystem();
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clear any notifications
    document.querySelectorAll(".notification").forEach((n) => n.remove());
  });

  describe("Permission Management", () => {
    it("should request notification permissions if not granted", async () => {
      global.Notification.permission = "default";
      await notificationSystem.requestPermission();
      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    it("should not request permissions if already granted", async () => {
      global.Notification.permission = "granted";
      await notificationSystem.requestPermission();
      expect(Notification.requestPermission).not.toHaveBeenCalled();
    });

    it("should handle denied permissions gracefully", async () => {
      global.Notification.permission = "denied";
      const result = await notificationSystem.requestPermission();
      expect(result).toBe(false);
    });
  });

  describe("Notification Display", () => {
    it("should show browser notification for new orders", () => {
      const orderData = {
        id: "123",
        customerName: "John Doe",
        items: [{ name: "Burger", quantity: 1 }],
      };

      notificationSystem.showNewOrderNotification(orderData);

      expect(global.Notification).toHaveBeenCalledWith(
        "New Order #123",
        expect.objectContaining({
          body: expect.stringContaining("John Doe"),
          icon: expect.any(String),
        })
      );
    });

    it("should play sound for new orders", () => {
      const orderData = { id: "123" };
      notificationSystem.showNewOrderNotification(orderData);
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("should handle multiple notifications", () => {
      const orders = [
        { id: "123", customerName: "John" },
        { id: "124", customerName: "Jane" },
      ];

      orders.forEach((order) => {
        notificationSystem.showNewOrderNotification(order);
      });

      expect(global.Notification).toHaveBeenCalledTimes(2);
    });

    it("should clear notifications after timeout", async () => {
      vi.useFakeTimers();

      const orderData = { id: "123" };
      notificationSystem.showNewOrderNotification(orderData);

      vi.advanceTimersByTime(5000);

      expect(Notification.prototype.close).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe("Sound Management", () => {
    it("should preload notification sound", () => {
      expect(mockAudio.load).toHaveBeenCalled();
    });

    it("should handle failed sound playback", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockAudio.play.mockRejectedValueOnce(new Error("Playback failed"));

      const orderData = { id: "123" };
      await notificationSystem.showNewOrderNotification(orderData);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error playing notification sound:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should mute and unmute sounds", () => {
      notificationSystem.mute();
      expect(notificationSystem.isMuted).toBe(true);

      const orderData = { id: "123" };
      notificationSystem.showNewOrderNotification(orderData);
      expect(mockAudio.play).not.toHaveBeenCalled();

      notificationSystem.unmute();
      expect(notificationSystem.isMuted).toBe(false);

      notificationSystem.showNewOrderNotification(orderData);
      expect(mockAudio.play).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle notification creation errors", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      global.Notification = vi.fn(() => {
        throw new Error("Failed to create notification");
      });

      const orderData = { id: "123" };
      notificationSystem.showNewOrderNotification(orderData);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error showing notification:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should handle permission request errors", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      global.Notification.requestPermission.mockRejectedValueOnce(
        new Error("Permission request failed")
      );

      await notificationSystem.requestPermission();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error requesting notification permission:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
