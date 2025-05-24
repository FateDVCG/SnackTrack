import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import WebSocketService from "../websocketService";

describe("WebSocketService", () => {
  let websocketService;
  let mockWebSocket;

  beforeEach(() => {
    // Mock WebSocket
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    global.WebSocket = vi.fn(() => mockWebSocket);

    websocketService = new WebSocketService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Connection Management", () => {
    it("should connect to WebSocket server", () => {
      websocketService.connect();
      expect(global.WebSocket).toHaveBeenCalled();
      expect(websocketService.isConnected).toBe(false); // Not connected until onopen fires
    });

    it("should handle successful connection", () => {
      const connectionCallback = vi.fn();
      websocketService.subscribe("connection", connectionCallback);

      websocketService.connect();
      mockWebSocket.onopen();

      expect(websocketService.isConnected).toBe(true);
      expect(connectionCallback).toHaveBeenCalledWith({ status: "connected" });
    });

    it("should handle connection failure", () => {
      const connectionCallback = vi.fn();
      websocketService.subscribe("connection", connectionCallback);

      websocketService.connect();
      mockWebSocket.onerror(new Error("Connection failed"));

      expect(connectionCallback).toHaveBeenCalledWith({
        status: "failed",
        error: expect.any(Error),
      });
    });

    it("should attempt to reconnect on disconnection", () => {
      vi.useFakeTimers();
      websocketService.connect();
      mockWebSocket.onclose();

      expect(websocketService.isConnected).toBe(false);
      expect(websocketService.reconnectAttempts).toBe(1);

      vi.advanceTimersByTime(1000);
      expect(global.WebSocket).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it("should stop reconnecting after max attempts", () => {
      vi.useFakeTimers();
      websocketService.connect();

      // Simulate multiple disconnections
      for (let i = 0; i < 6; i++) {
        mockWebSocket.onclose();
        vi.advanceTimersByTime(1000 * Math.pow(2, i));
      }

      expect(websocketService.reconnectAttempts).toBe(5); // Max attempts
      expect(global.WebSocket).toHaveBeenCalledTimes(6); // Initial + 5 retries

      vi.useRealTimers();
    });
  });

  describe("Message Handling", () => {
    it("should handle incoming messages", () => {
      const orderCallback = vi.fn();
      websocketService.subscribe("order_update", orderCallback);

      websocketService.connect();
      mockWebSocket.onmessage({
        data: JSON.stringify({
          type: "order_update",
          orderId: "123",
          status: "completed",
        }),
      });

      expect(orderCallback).toHaveBeenCalledWith({
        type: "order_update",
        orderId: "123",
        status: "completed",
      });
    });

    it("should handle message parsing errors", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      websocketService.connect();

      mockWebSocket.onmessage({ data: "invalid json" });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error parsing WebSocket message:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Subscription Management", () => {
    it("should manage multiple subscribers", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      websocketService.subscribe("order_update", callback1);
      websocketService.subscribe("order_update", callback2);

      websocketService.connect();
      mockWebSocket.onmessage({
        data: JSON.stringify({
          type: "order_update",
          orderId: "123",
        }),
      });

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it("should allow unsubscribing", () => {
      const callback = vi.fn();
      const unsubscribe = websocketService.subscribe("order_update", callback);

      unsubscribe();

      websocketService.connect();
      mockWebSocket.onmessage({
        data: JSON.stringify({
          type: "order_update",
          orderId: "123",
        }),
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle subscriber callback errors", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const callback = vi.fn().mockImplementation(() => {
        throw new Error("Callback error");
      });

      websocketService.subscribe("order_update", callback);

      websocketService.connect();
      mockWebSocket.onmessage({
        data: JSON.stringify({
          type: "order_update",
          orderId: "123",
        }),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in subscriber callback:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Cleanup", () => {
    it("should clean up on disconnect", () => {
      websocketService.connect();
      websocketService.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalled();
      expect(websocketService.ws).toBeNull();
      expect(websocketService.isConnected).toBe(false);
    });
  });
});
