const analyticsModel = require("../models/analyticsModel");

const formatTimeLabel = (timeUnit, range) => {
  switch (range) {
    case "day":
      return `${timeUnit}:00`;
    case "week":
      return [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][timeUnit];
    case "month":
      return `Day ${timeUnit}`;
  }
};

/**
 * Gets comprehensive analytics for a specific time range
 * @param {string} range - 'day', 'week', or 'month'
 * @returns {Promise<Object>} Combined analytics data
 */
async function getAnalytics(range) {
  try {
    // Get all analytics data in parallel
    const [salesData, topItems, revenueData, orderTypeData] = await Promise.all(
      [
        analyticsModel.getSalesAnalytics(range),
        analyticsModel.getTopSellingItems(range),
        analyticsModel.getRevenueOverTime(range),
        analyticsModel.getOrdersByType(range),
      ]
    );

    // Format revenue over time data
    const revenueOverTime = revenueData.map((row) => ({
      date: formatTimeLabel(parseInt(row.time_unit), range),
      revenue: parseFloat(row.revenue) || 0,
      count: parseInt(row.count) || 0,
    }));

    // Format orders by type data
    const ordersByType = orderTypeData.map((type) => ({
      type: type.type,
      count: parseInt(type.count) || 0,
      byTime: Array.isArray(type.by_time)
        ? type.by_time.map((timePoint) => ({
            date: formatTimeLabel(parseInt(timePoint.time_unit), range),
            count: parseInt(timePoint.count) || 0,
          }))
        : [], // Return empty array if by_time is not an array
    }));

    // Combine all data into a single response with the correct structure for tests
    return {
      success: true,
      data: {
        sales: {
          totalOrders: parseInt(salesData.total_orders) || 0,
          totalRevenue: parseFloat(salesData.total_revenue) || 0,
          averageOrderValue: parseFloat(salesData.average_order_value) || 0,
          completedOrders: parseInt(salesData.completed_orders) || 0,
          cancelledOrders: parseInt(salesData.cancelled_orders) || 0,
          completionRate: salesData.total_orders
            ? (
                (salesData.completed_orders / salesData.total_orders) *
                100
              ).toFixed(2)
            : 0,
        },
        topSellingItems: topItems.map((item) => ({
          name: item.item_name || "Unknown Item",
          quantitySold: parseInt(item.quantity_sold) || 0,
          revenue: parseFloat(item.total_revenue) || 0,
        })),
        revenueOverTime,
        ordersByType,
      },
    };
  } catch (error) {
    console.error("Error getting analytics:", error);
    throw error;
  }
}

module.exports = {
  getAnalytics,
};
