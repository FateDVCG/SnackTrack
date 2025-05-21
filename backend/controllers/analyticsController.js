const analyticsModel = require("../models/analyticsModel");

/**
 * Gets comprehensive analytics for a specific time range
 * @param {string} range - 'day', 'week', or 'month'
 * @returns {Promise<Object>} Combined analytics data
 */
async function getAnalytics(range) {
  try {
    // Get all analytics data in parallel
    const [salesData, topItems, hourlyData] = await Promise.all([
      analyticsModel.getSalesAnalytics(range),
      analyticsModel.getTopSellingItems(range),
      analyticsModel.getHourlyDistribution(range),
    ]);

    // Combine all data into a single response
    return {
      range,
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
        name: item.item_name,
        quantitySold: parseInt(item.quantity_sold),
        revenue: parseFloat(item.total_revenue),
      })),
      hourlyDistribution: hourlyData.map((hour) => ({
        hour: parseInt(hour.hour),
        orderCount: parseInt(hour.order_count),
      })),
    };
  } catch (error) {
    console.error("Error getting analytics:", error);
    throw error;
  }
}

module.exports = {
  getAnalytics,
};
