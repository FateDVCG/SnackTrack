import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { orderService } from "../orderService";
import axios from "axios";

vi.mock("axios");

describe("Order Service", () => {
  const mockOrder = {
    id: 1,
    customerName: "Test Customer",
    customerPhone: "+1234567890",
    type: "Delivery",
    totalPrice: 150.99,
    items: [{ item: { id: 1, name: "Burger", price: 120.99 }, quantity: 1 }],
    deliveryAddress: "123 Test St",
    specialInstructions: "Ring doorbell",
    status: "new",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Order Operations", () => {
    it("should fetch orders", async () => {
      axios.get.mockResolvedValueOnce({ data: [mockOrder] });

      const orders = await orderService.getOrders();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/orders")
      );
      expect(orders).toEqual([mockOrder]);
    });

    it("should handle fetch orders error", async () => {
      const error = new Error("Network error");
      axios.get.mockRejectedValueOnce(error);

      await expect(orderService.getOrders()).rejects.toThrow("Network error");
    });

    it("should update order status", async () => {
      const updatedOrder = { ...mockOrder, status: "accepted" };
      axios.put.mockResolvedValueOnce({ data: updatedOrder });

      const result = await orderService.updateOrderStatus(1, "accepted");

      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining("/api/orders/1/status"),
        { status: "accepted" }
      );
      expect(result).toEqual(updatedOrder);
    });

    it("should handle update status error", async () => {
      const error = new Error("Failed to update");
      axios.put.mockRejectedValueOnce(error);

      await expect(
        orderService.updateOrderStatus(1, "accepted")
      ).rejects.toThrow("Failed to update");
    });

    it("should create new order", async () => {
      const orderData = {
        customerName: "Test Customer",
        customerPhone: "+1234567890",
        type: "Delivery",
        totalPrice: 150.99,
        items: [
          { item: { id: 1, name: "Burger", price: 120.99 }, quantity: 1 },
        ],
        deliveryAddress: "123 Test St",
        specialInstructions: "Ring doorbell",
      };

      axios.post.mockResolvedValueOnce({ data: mockOrder });

      const result = await orderService.createOrder(orderData);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/orders"),
        expect.objectContaining(orderData)
      );
      expect(result).toEqual(mockOrder);
    });

    it("should handle create order error", async () => {
      const error = new Error("Failed to create");
      axios.post.mockRejectedValueOnce(error);

      const orderData = { customerName: "Test" };
      await expect(orderService.createOrder(orderData)).rejects.toThrow(
        "Failed to create"
      );
    });

    it("should use default values when creating order with minimal data", async () => {
      const minimalData = {
        customerPhone: "+1234567890",
        items: [
          { item: { id: 1, name: "Burger", price: 120.99 }, quantity: 1 },
        ],
        totalPrice: 120.99,
      };

      axios.post.mockResolvedValueOnce({ data: mockOrder });

      await orderService.createOrder(minimalData);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/orders"),
        expect.objectContaining({
          customerName: "Anonymous Customer",
          type: "Delivery",
        })
      );
    });
  });

  describe("Currency Conversion", () => {
    it("should convert PHP to USD", () => {
      const phpAmount = 1000;
      const usdAmount = orderService.convertCurrency(phpAmount, "PHP", "USD");
      expect(usdAmount).toBe(20); // 1000 * 0.02
    });

    it("should convert USD to PHP", () => {
      const usdAmount = 20;
      const phpAmount = orderService.convertCurrency(usdAmount, "USD", "PHP");
      expect(phpAmount).toBe(1000); // 20 * 50
    });

    it("should use PHP to USD as default conversion", () => {
      const phpAmount = 1000;
      const usdAmount = orderService.convertCurrency(phpAmount);
      expect(usdAmount).toBe(20);
    });
  });
});
