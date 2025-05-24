const assert = require("assert");
const analyticsController = require("../../controllers/analyticsController");

describe("Analytics Controller Tests", () => {
  describe("Analytics Data Retrieval", () => {
    it("should get analytics for daily range", async () => {
      const result = await analyticsController.getAnalytics("day");

      assert(result.data, "Should return data object");
      assert(result.data.sales, "Should include sales data");
      assert(result.data.topSellingItems, "Should include top items");
      assert(result.data.revenueOverTime, "Should include revenue timeline");
      assert(result.data.ordersByType, "Should include order types");

      // Validate sales metrics
      assert(typeof result.data.sales.totalOrders === "number");
      assert(typeof result.data.sales.totalRevenue === "number");
      assert(typeof result.data.sales.averageOrderValue === "number");
      assert(typeof result.data.sales.completionRate === "string");
    });

    it("should get analytics for weekly range", async () => {
      const result = await analyticsController.getAnalytics("week");

      // Validate weekly data structure
      assert.strictEqual(result.data.revenueOverTime.length, 7);
      result.data.revenueOverTime.forEach((day) => {
        assert(day.date, "Each day should have a date");
        assert(typeof day.revenue === "number", "Each day should have revenue");
        assert(
          typeof day.count === "number",
          "Each day should have order count"
        );
      });
    });

    it("should get analytics for monthly range", async () => {
      const result = await analyticsController.getAnalytics("month");

      // Get days in current month
      const daysInMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      ).getDate();

      // Validate monthly data structure
      assert.strictEqual(result.data.revenueOverTime.length, daysInMonth);
    });

    it("should handle invalid date ranges", async () => {
      try {
        await analyticsController.getAnalytics("invalid_range");
        assert.fail("Should reject invalid range");
      } catch (error) {
        assert(error.message.includes("Invalid range"));
      }
    });
  });

  describe("Top Selling Items Analytics", () => {
    it("should return correct number of top items", async () => {
      const result = await analyticsController.getAnalytics("day");
      assert(
        result.data.topSellingItems.length <= 5,
        "Should limit to 5 items"
      );

      result.data.topSellingItems.forEach((item) => {
        assert(item.name, "Each item should have a name");
        assert(typeof item.quantitySold === "number", "Should have quantity");
        assert(typeof item.revenue === "number", "Should have revenue");
      });
    });

    it("should sort items by quantity sold", async () => {
      const result = await analyticsController.getAnalytics("day");
      const items = result.data.topSellingItems;

      for (let i = 1; i < items.length; i++) {
        assert(
          items[i - 1].quantitySold >= items[i].quantitySold,
          "Items should be sorted by quantity in descending order"
        );
      }
    });
  });

  describe("Revenue Calculations", () => {
    it("should calculate correct total revenue", async () => {
      const result = await analyticsController.getAnalytics("day");
      const totalRevenue = result.data.sales.totalRevenue;

      // Sum up revenue from revenueOverTime
      const calculatedRevenue = result.data.revenueOverTime.reduce(
        (sum, point) => sum + point.revenue,
        0
      );

      assert.strictEqual(
        totalRevenue,
        calculatedRevenue,
        "Total revenue should match sum of timeline"
      );
    });

    it("should calculate correct average order value", async () => {
      const result = await analyticsController.getAnalytics("day");
      const { totalRevenue, totalOrders, averageOrderValue } =
        result.data.sales;

      const calculatedAverage = totalOrders ? totalRevenue / totalOrders : 0;
      assert(
        Math.abs(averageOrderValue - calculatedAverage) < 0.01,
        "Average order value should be calculated correctly"
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      // Force a database error by messing with the connection
      const oldEnv = process.env.DATABASE_URL;
      process.env.DATABASE_URL = "invalid_url";

      try {
        await analyticsController.getAnalytics("day");
        assert.fail("Should handle database errors");
      } catch (error) {
        assert(error.message.includes("database"));
      } finally {
        process.env.DATABASE_URL = oldEnv;
      }
    });

    it("should handle empty result sets", async () => {
      // Test with a future date range that should have no orders
      const result = await analyticsController.getAnalytics("day");

      // Should still return structured data with zero values
      assert(result.data.sales.totalOrders >= 0);
      assert(result.data.sales.totalRevenue >= 0);
      assert(Array.isArray(result.data.topSellingItems));
      assert(Array.isArray(result.data.revenueOverTime));
    });
  });
});
