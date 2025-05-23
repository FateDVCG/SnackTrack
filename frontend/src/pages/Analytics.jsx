import React, { useState, useEffect, useContext } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
  Paper,
} from "@mui/material";
import { analyticsService } from "../services/analyticsService";
import { CurrencyContext } from "../App";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

// Generate hourly data for today
const generateHourlyData = () => {
  const hours = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    hours.push({
      date: `${i}:00`,
      revenue: 0,
      count: 0,
    });
  }
  return hours;
};

// Generate daily data for week
const generateWeeklyData = () => {
  return [
    { date: "Monday", revenue: 0, count: 0 },
    { date: "Tuesday", revenue: 0, count: 0 },
    { date: "Wednesday", revenue: 0, count: 0 },
    { date: "Thursday", revenue: 0, count: 0 },
    { date: "Friday", revenue: 0, count: 0 },
    { date: "Saturday", revenue: 0, count: 0 },
    { date: "Sunday", revenue: 0, count: 0 },
  ];
};

// Generate daily data for month
const generateMonthlyData = () => {
  const days = [];
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: format(new Date(now.getFullYear(), now.getMonth(), i), "MMM d"),
      revenue: 0,
      count: 0,
    });
  }
  return days;
};

// Fallback data with time-based variations
const getFallbackData = (timeRange) => ({
  sales: {
    totalOrders: 150,
    completedOrders: 120,
    cancelledOrders: 10,
    totalRevenue: 15000,
    averageOrderValue: 100,
    completionRate: 80,
  },
  topSellingItems: [
    { name: "Burger", quantitySold: 50, revenue: 5000 },
    { name: "Pizza", quantitySold: 40, revenue: 4800 },
    { name: "Fries", quantitySold: 80, revenue: 2400 },
    { name: "Soda", quantitySold: 100, revenue: 2000 },
  ],
  revenueOverTime:
    timeRange === "day"
      ? generateHourlyData()
      : timeRange === "week"
      ? generateWeeklyData()
      : generateMonthlyData(),
  ordersByType: [
    {
      type: "Dine In",
      count: 50,
      byTime:
        timeRange === "day"
          ? generateHourlyData()
          : timeRange === "week"
          ? generateWeeklyData()
          : generateMonthlyData(),
    },
    {
      type: "Take Out",
      count: 35,
      byTime:
        timeRange === "day"
          ? generateHourlyData()
          : timeRange === "week"
          ? generateWeeklyData()
          : generateMonthlyData(),
    },
    {
      type: "Delivery",
      count: 65,
      byTime:
        timeRange === "day"
          ? generateHourlyData()
          : timeRange === "week"
          ? generateWeeklyData()
          : generateMonthlyData(),
    },
  ],
});

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("day");
  const [analytics, setAnalytics] = useState(() => getFallbackData("day"));
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    source: "fallback",
    lastUpdated: null,
  });
  const { currency } = useContext(CurrencyContext);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getAnalytics(timeRange);

      if (response?.data) {
        setAnalytics(response.data);
        setDebugInfo({
          source: "backend",
          lastUpdated: new Date().toLocaleTimeString(),
        });
      } else {
        setAnalytics(getFallbackData(timeRange));
        setDebugInfo({
          source: "fallback",
          lastUpdated: new Date().toLocaleTimeString(),
        });
      }
    } catch (err) {
      console.log("Using fallback data due to error:", err);
      setAnalytics(getFallbackData(timeRange));
      setDebugInfo({
        source: "fallback (error)",
        lastUpdated: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const SummaryCards = () => (
    <>
      <Typography variant="h6" gutterBottom>
        Summary
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Orders
            </Typography>
            <Typography variant="h4">{analytics.sales.totalOrders}</Typography>
            <Typography color="textSecondary" sx={{ mt: 1 }}>
              Completion Rate: {analytics.sales.completionRate}%
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Revenue
            </Typography>
            <Typography variant="h4">
              {currency} {analytics.sales.totalRevenue.toFixed(2)}
            </Typography>
            <Typography color="textSecondary" sx={{ mt: 1 }}>
              Completed Orders: {analytics.sales.completedOrders}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Average Order Value
            </Typography>
            <Typography variant="h4">
              {currency} {analytics.sales.averageOrderValue.toFixed(2)}
            </Typography>
            <Typography color="textSecondary" sx={{ mt: 1 }}>
              Cancelled Orders: {analytics.sales.cancelledOrders}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </>
  );

  const RevenueChart = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Revenue Over Time
        <Typography variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
          (
          {timeRange === "day"
            ? "Hourly"
            : timeRange === "week"
            ? "Daily"
            : "Monthly"}
          )
        </Typography>
      </Typography>
      <Card sx={{ p: 2, height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={analytics.revenueOverTime || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval={timeRange === "month" ? 2 : 0}
            />
            <YAxis />
            <Tooltip formatter={(value) => `${currency} ${value.toFixed(2)}`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#1976d2"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </Box>
  );

  const OrdersChart = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Orders by Type
        <Typography variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
          (Total Count)
        </Typography>
      </Typography>
      <Card sx={{ p: 2, height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analytics.ordersByType || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Box>
  );

  const TopSellingItems = () => (
    <>
      <Typography variant="h6" gutterBottom>
        Top Selling Items
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 2,
        }}
      >
        {analytics.topSellingItems.map((item, index) => (
          <Card key={index}>
            <CardContent>
              <Typography variant="h6">{item.name}</Typography>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 2,
                }}
              >
                <Typography color="textSecondary">
                  Quantity Sold: {item.quantitySold}
                </Typography>
                <Typography color="primary">
                  {currency} {item.revenue.toFixed(2)}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: "100%",
                  height: 4,
                  bgcolor: "rgba(25, 118, 210, 0.1)",
                  mt: 1,
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${
                      (item.quantitySold /
                        analytics.topSellingItems[0].quantitySold) *
                      100
                    }%`,
                    height: "100%",
                    bgcolor: "primary.main",
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(e, v) => v && setTimeRange(v)}
          size="small"
        >
          <ToggleButton value="day">Today</ToggleButton>
          <ToggleButton value="week">This Week</ToggleButton>
          <ToggleButton value="month">This Month</ToggleButton>
        </ToggleButtonGroup>

        {/* Debug Info */}
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Data Source: {debugInfo.source}
          {debugInfo.lastUpdated && ` • Last Updated: ${debugInfo.lastUpdated}`}
        </Typography>
      </Box>

      {loading && <LinearProgress />}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 2,
          p: 2,
          flex: 1,
          overflow: "auto",
          height: "calc(100vh - 112px)",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "fit-content",
            minHeight: "100%",
            p: 2,
          }}
        >
          <SummaryCards />
          <RevenueChart />
          <OrdersChart />
        </Paper>

        <Paper
          elevation={0}
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "fit-content",
            minHeight: "100%",
            p: 2,
          }}
        >
          <TopSellingItems />
        </Paper>
      </Box>
    </Box>
  );
};

export default Analytics;
