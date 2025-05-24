import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { analyticsService } from "../analyticsService";
import axios from "axios";

vi.mock("axios");

describe("Analytics Service", () => {
  const mockAnalyticsData = {
    sales: {
      totalRevenue: 5000.5,
      completedOrders: 42,
      cancelledOrders: 3,
      averageOrderValue: 119.06,
      completionRate: "93%",
    },
    topItems: [
      { name: "Burger", quantitySold: 30, revenue: 3629.7 },
      { name: "Fries", quantitySold: 25, revenue: 1024.75 },
    ],
    revenueByDay: [
      { date: "2025-05-23", revenue: 2500.25 },
      { date: "2025-05-24", revenue: 2500.25 },
    ],
    ordersByType: [
      { type: "Delivery", count: 25 },
      { type: "Pickup", count: 12 },
      { type: "Dine-in", count: 5 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    analyticsService.clearCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Data Fetching", () => {
    it("should fetch analytics data with default range", async () => {
      axios.get.mockResolvedValueOnce({ data: mockAnalyticsData });

      const data = await analyticsService.getAnalytics();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/analytics"),
        expect.objectContaining({
          params: { range: "day" },
        })
      );
      expect(data).toEqual(mockAnalyticsData);
    });

    it("should fetch analytics data with specified range", async () => {
      axios.get.mockResolvedValueOnce({ data: mockAnalyticsData });

      await analyticsService.getAnalytics("week");

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/analytics"),
        expect.objectContaining({
          params: { range: "week" },
        })
      );
    });

    it("should handle API errors", async () => {
      const error = new Error("API Error");
      axios.get.mockRejectedValueOnce(error);

      await expect(analyticsService.getAnalytics()).rejects.toThrow(
        "API Error"
      );
    });
  });

  describe("Data Processing", () => {
    it("should calculate correct metrics", async () => {
      axios.get.mockResolvedValueOnce({ data: mockAnalyticsData });

      const data = await analyticsService.getAnalytics();

      // Verify sales metrics
      expect(data.sales.totalRevenue).toBe(5000.5);
      expect(data.sales.completedOrders).toBe(42);
      expect(data.sales.averageOrderValue).toBe(119.06);
      expect(data.sales.completionRate).toBe("93%");
    });

    it("should process top items correctly", async () => {
      axios.get.mockResolvedValueOnce({ data: mockAnalyticsData });

      const data = await analyticsService.getAnalytics();
      const topItem = data.topItems[0];

      expect(topItem.name).toBe("Burger");
      expect(topItem.quantitySold).toBe(30);
      expect(topItem.revenue).toBe(3629.7);
    });

    it("should process revenue trends correctly", async () => {
      axios.get.mockResolvedValueOnce({ data: mockAnalyticsData });

      const data = await analyticsService.getAnalytics();

      expect(data.revenueByDay).toHaveLength(2);
      expect(data.revenueByDay[0].revenue).toBe(2500.25);
    });

    it("should process order types correctly", async () => {
      axios.get.mockResolvedValueOnce({ data: mockAnalyticsData });

      const data = await analyticsService.getAnalytics();

      expect(data.ordersByType).toHaveLength(3);
      expect(data.ordersByType[0]).toEqual({
        type: "Delivery",
        count: 25,
      });
    });
  });

  describe("Caching", () => {
    it("should cache data for 5 minutes", async () => {
      axios.get.mockResolvedValue({ data: mockAnalyticsData });

      // First call
      await analyticsService.getAnalytics();
      expect(axios.get).toHaveBeenCalledTimes(1);

      // Second call within 5 minutes
      await analyticsService.getAnalytics();
      expect(axios.get).toHaveBeenCalledTimes(1); // Should use cached data

      // Advance time by 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);

      // Call after cache expiry
      await analyticsService.getAnalytics();
      expect(axios.get).toHaveBeenCalledTimes(2); // Should fetch new data
    });

    it("should bypass cache with force refresh", async () => {
      axios.get.mockResolvedValue({ data: mockAnalyticsData });

      // First call
      await analyticsService.getAnalytics();
      expect(axios.get).toHaveBeenCalledTimes(1);

      // Force refresh
      await analyticsService.getAnalytics(undefined, true);
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error Recovery", () => {
    it("should retry failed requests", async () => {
      axios.get
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ data: mockAnalyticsData });

      const data = await analyticsService.getAnalytics();

      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(data).toEqual(mockAnalyticsData);
    });

    it("should handle multiple failures and eventual success", async () => {
      axios.get
        .mockRejectedValueOnce(new Error("Failed 1"))
        .mockRejectedValueOnce(new Error("Failed 2"))
        .mockResolvedValueOnce({ data: mockAnalyticsData });

      const data = await analyticsService.getAnalytics();

      expect(axios.get).toHaveBeenCalledTimes(3);
      expect(data).toEqual(mockAnalyticsData);
    });

    it("should give up after max retries", async () => {
      const error = new Error("Persistent failure");
      axios.get.mockRejectedValue(error);

      await expect(analyticsService.getAnalytics()).rejects.toThrow(error);
      expect(axios.get).toHaveBeenCalledTimes(3); // MAX_RETRIES
    });
  });
});
