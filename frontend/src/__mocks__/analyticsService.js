// Mock implementation for analyticsService
export const analyticsService = {
  getAnalytics: jest.fn().mockResolvedValue({
    sales: {
      totalRevenue: 5000.5,
      completedOrders: 42,
      averageOrderValue: 119.06
    },
    topItems: [
      { name: "Burger", quantity: 25, revenue: 3025 },
      { name: "Fries", quantity: 20, revenue: 820 }
    ],
    revenueByDay: [
      { date: "2023-05-24", revenue: 2500.25 },
      { date: "2023-05-25", revenue: 2500.25 }
    ],
    ordersByType: [
      { type: "Delivery", count: 20, percentage: 48 },
      { type: "Pickup", count: 15, percentage: 36 },
      { type: "Dine-in", count: 7, percentage: 16 }
    ]
  }),
  getAnalyticsByDateRange: jest.fn().mockImplementation((startDate, endDate) => 
    Promise.resolve({
      sales: {
        totalRevenue: 5000.5,
        completedOrders: 42,
        averageOrderValue: 119.06
      },
      topItems: [
        { name: "Burger", quantity: 25, revenue: 3025 },
        { name: "Fries", quantity: 20, revenue: 820 }
      ],
      revenueByDay: [
        { date: startDate, revenue: 2500.25 },
        { date: endDate, revenue: 2500.25 }
      ],
      ordersByType: [
        { type: "Delivery", count: 20, percentage: 48 },
        { type: "Pickup", count: 15, percentage: 36 },
        { type: "Dine-in", count: 7, percentage: 16 }
      ]
    })
  ),
  clearCache: jest.fn()
};