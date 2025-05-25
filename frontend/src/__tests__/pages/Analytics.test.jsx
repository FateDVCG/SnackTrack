import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { analyticsService } from "../../services/analyticsService";
import Analytics from "../../pages/Analytics";
import { CurrencyContext } from "../../App";
import userEvent from "@testing-library/user-event";

vi.mock("../../services/analyticsService", () => ({
  analyticsService: {
    getAnalytics: vi.fn(),
  },
}));

// Mock recharts components
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

const theme = createTheme();

describe("Analytics Page", () => {
  const mockAnalyticsData = {
    sales: {
      totalOrders: 150,
      totalRevenue: 15000.5,
      averageOrderValue: 100.0,
      completionRate: "85%",
      completedOrders: 127,
      cancelledOrders: 23,
    },
    revenueOverTime: [
      { date: "08:00", revenue: 1200.5, count: 12 },
      { date: "09:00", revenue: 1500.75, count: 15 },
    ],
    ordersByType: [
      { type: "Delivery", count: 70 },
      { type: "Dine In", count: 50 },
      { type: "Take Out", count: 30 },
    ],
    topSellingItems: [
      { name: "Burger", quantitySold: 45, revenue: 5400.0 },
      { name: "Fries", quantitySold: 30, revenue: 1200.0 },
    ],
  };

  const renderAnalytics = () => {
    return render(
      <CurrencyContext.Provider value={{ currency: "₱", setCurrency: vi.fn() }}>
        <ThemeProvider theme={theme}>
          <Analytics />
        </ThemeProvider>
      </CurrencyContext.Provider>
    );
  };

  beforeEach(() => {
    vi.useFakeTimers();
    analyticsService.getAnalytics.mockResolvedValue({
      data: mockAnalyticsData,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should render analytics summary cards", async () => {
    renderAnalytics();

    await waitFor(() => {
      // Check total orders
      expect(screen.getByText("150")).toBeInTheDocument();
      // Check revenue
      expect(screen.getByText("₱ 15,000.50")).toBeInTheDocument();
      // Check average order value
      expect(screen.getByText("₱ 100.00")).toBeInTheDocument();
      // Check completion rate
      expect(screen.getByText("85%")).toBeInTheDocument();
    });
  });

  it("should handle time range changes", async () => {
    renderAnalytics();

    // Click week range
    fireEvent.click(screen.getByText("This Week"));
    await waitFor(() => {
      expect(analyticsService.getAnalytics).toHaveBeenCalledWith("week");
    });

    // Click month range
    fireEvent.click(screen.getByText("This Month"));
    await waitFor(() => {
      expect(analyticsService.getAnalytics).toHaveBeenCalledWith("month");
    });

    // Click day range
    fireEvent.click(screen.getByText("Today"));
    await waitFor(() => {
      expect(analyticsService.getAnalytics).toHaveBeenCalledWith("day");
    });
  });

  it("should render charts with correct data", async () => {
    renderAnalytics();

    await waitFor(() => {
      // Revenue chart title
      expect(screen.getByText("Revenue Over Time")).toBeInTheDocument();
      // Orders by type chart title
      expect(screen.getByText("Orders by Type")).toBeInTheDocument();
      // Top selling items title
      expect(screen.getByText("Top Selling Items")).toBeInTheDocument();
    });

    // Check if chart data is displayed
    expect(screen.getByText("Delivery")).toBeInTheDocument();
    expect(screen.getByText("Burger")).toBeInTheDocument();
    expect(screen.getByText("Fries")).toBeInTheDocument();
  });

  it("should handle empty data sets gracefully", async () => {
    analyticsService.getAnalytics.mockResolvedValueOnce({
      data: {
        sales: {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          completionRate: "0%",
          completedOrders: 0,
          cancelledOrders: 0,
        },
        revenueOverTime: [],
        ordersByType: [],
        topSellingItems: [],
      },
    });

    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText("₱ 0.00")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    // Check empty state messages
    expect(screen.getByText("No revenue data available")).toBeInTheDocument();
    expect(
      screen.getByText("No order type data available")
    ).toBeInTheDocument();
    expect(screen.getByText(/No top selling items/i)).toBeInTheDocument();
  });

  it("should handle API errors gracefully", async () => {
    const error = new Error("Failed to fetch analytics data");
    analyticsService.getAnalytics.mockRejectedValueOnce(error);

    renderAnalytics();

    await waitFor(() => {
      // Should show fallback data
      expect(screen.getByText(/fallback/i)).toBeInTheDocument();
    });
  });

  it("should update data periodically", async () => {
    vi.useFakeTimers();
    renderAnalytics();

    await waitFor(() => {
      expect(analyticsService.getAnalytics).toHaveBeenCalledTimes(1);
    });

    // Fast forward 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      expect(analyticsService.getAnalytics).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });

  it("should format numbers correctly", async () => {
    renderAnalytics();

    await waitFor(() => {
      // Check currency formatting
      expect(screen.getByText("₱ 15,000.50")).toBeInTheDocument();
      expect(screen.getByText("₱ 100.00")).toBeInTheDocument();

      // Check percentage formatting
      expect(screen.getByText("85%")).toBeInTheDocument();
    });
  });

  it("should show correct debug information", async () => {
    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText(/Data Source:/)).toBeInTheDocument();
      expect(screen.getByText(/Last Updated:/)).toBeInTheDocument();
    });
  });

  describe("Additional Analytics Tests", () => {
    const mockAnalyticsData = {
      sales: {
        totalRevenue: 5000.5,
        completedOrders: 42,
        cancelledOrders: 3,
        averageOrderValue: 119.06,
      },
      topItems: [
        { name: "Burger", quantitySold: 30, revenue: 3629.7 },
        { name: "Fries", quantitySold: 25, revenue: 1024.75 },
      ],
      revenueByDay: [
        { date: "2025-05-23", revenue: 2500.25 },
        { date: "2025-05-24", revenue: 2500.25 },
      ],
    };

    beforeEach(() => {
      vi.clearAllMocks();
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsData),
        })
      );
    });

    const renderComponent = (currency = "₱") => {
      return render(
        <CurrencyContext.Provider value={{ currency }}>
          <Analytics />
        </CurrencyContext.Provider>
      );
    };

    it("should render analytics metrics correctly", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("₱5000.50")).toBeInTheDocument(); // Total Revenue
        expect(screen.getByText("₱119.06")).toBeInTheDocument(); // Avg Order Value
        expect(screen.getByText("Completed Orders: 42")).toBeInTheDocument();
        expect(screen.getByText("Cancelled Orders: 3")).toBeInTheDocument();
      });
    });

    it("should handle currency changes", async () => {
      const { rerender } = renderComponent("₱");

      await waitFor(() => {
        expect(screen.getByText("₱5000.50")).toBeInTheDocument();
      });

      rerender(
        <CurrencyContext.Provider value={{ currency: "$" }}>
          <Analytics />
        </CurrencyContext.Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("$100.01")).toBeInTheDocument(); // 5000.50 PHP = 100.01 USD
      });
    });

    it("should show top selling items", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Burger")).toBeInTheDocument();
        expect(screen.getByText("Fries")).toBeInTheDocument();
        expect(screen.getByText("Quantity Sold: 30")).toBeInTheDocument();
        expect(screen.getByText("₱3629.70")).toBeInTheDocument();
      });
    });

    it("should handle date range changes", async () => {
      renderComponent();

      // Click day filter
      const dayButton = screen.getByRole("button", { name: /day/i });
      await userEvent.click(dayButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("range=day")
        );
      });

      // Click week filter
      const weekButton = screen.getByRole("button", { name: /week/i });
      await userEvent.click(weekButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("range=week")
        );
      });
    });

    it("should handle loading state", async () => {
      // Mock a slow response
      global.fetch = vi.fn(
        () =>
          new Promise((resolve) =>
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve(mockAnalyticsData),
              });
            }, 100)
          )
      );

      renderComponent();

      expect(screen.getByRole("progressbar")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
        expect(screen.getByText("₱5000.50")).toBeInTheDocument();
      });
    });

    it("should handle error state", async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error("API Error")));

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText(/error loading analytics data/i)
        ).toBeInTheDocument();
      });
    });
  });
});
