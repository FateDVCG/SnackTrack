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
 * Gets comprehensive analytics for a specific time range or custom date range
 * @param {Object} params - { range, startDate, endDate }
 * @returns {Promise<Object>} Combined analytics data
 */
async function getAnalytics({ range, startDate, endDate }) {
  try {
    // Pass custom dates to model if provided, else use range
    const modelParams = { range, startDate, endDate };
    const [salesData, topItems, revenueData, orderTypeData] = await Promise.all(
      [
        analyticsModel.getSalesAnalytics(modelParams),
        analyticsModel.getTopSellingItems(modelParams),
        analyticsModel.getRevenueOverTime(modelParams),
        analyticsModel.getOrdersByType(modelParams), // Pass the full params object
      ]
    );

    // Use range for formatting, fallback to 'custom' if not present
    const formatRange = range || "custom";
    const formatTime = (unit) => formatTimeLabel(parseInt(unit), formatRange);

    // Format revenue over time data
    const revenueOverTime = revenueData.map((row) => ({
      date: formatTime(row.time_unit),
      revenue: parseFloat(row.revenue) || 0,
      count: parseInt(row.count) || 0,
    }));

    // Format orders by type data
    const ordersByType = orderTypeData.map((type) => ({
      type: type.type,
      count: parseInt(type.count) || 0,
      byTime: Array.isArray(type.by_time)
        ? type.by_time.map((timePoint) => ({
            date: formatTime(timePoint.time_unit),
            count: parseInt(timePoint.count) || 0,
          }))
        : [],
    }));

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
