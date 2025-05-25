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
  Button,
  TextField,
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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  const [customRangeMode, setCustomRangeMode] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let response;
      if (customRangeMode && dateRange[0] && dateRange[1]) {
        const startDate = dateRange[0].toISOString().slice(0, 10);
        const endDate = dateRange[1].toISOString().slice(0, 10);
        response = await analyticsService.getAnalyticsByDateRange(
          startDate,
          endDate
        );
      } else {
        response = await analyticsService.getAnalytics(timeRange);
      }

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
    if (customRangeMode) {
      if (dateRange[0] && dateRange[1]) fetchAnalytics();
    } else {
      fetchAnalytics();
    }
    // eslint-disable-next-line
  }, [timeRange, customRangeMode, dateRange]);

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
        {analytics.revenueOverTime && analytics.revenueOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval={timeRange === "month" ? 2 : 0}
              />
              <YAxis />
              <Tooltip
                formatter={(value) => `${currency} ${value.toFixed(2)}`}
              />
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
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="text.secondary">
              No revenue data available
            </Typography>
          </Box>
        )}
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
        {analytics.ordersByType && analytics.ordersByType.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.ordersByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="text.secondary">
              No order type data available
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );

  const TopSellingItems = () => {
    // Calculate the maximum quantity for proper scaling
    const maxQuantity =
      analytics.topSellingItems && analytics.topSellingItems.length > 0
        ? Math.max(
            ...analytics.topSellingItems.map((item) => item.quantitySold || 0)
          )
        : 1;

    return (
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
          {analytics.topSellingItems && analytics.topSellingItems.length > 0 ? (
            analytics.topSellingItems.map((item, index) => (
              <Card key={index}>
                <CardContent>
                  <Typography variant="h6">
                    {item.name || "Unknown Item"}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 2,
                    }}
                  >
                    <Typography color="textSecondary">
                      Quantity Sold: {item.quantitySold || 0}
                    </Typography>
                    <Typography color="primary">
                      {currency} {(item.revenue || 0).toFixed(2)}
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
                          maxQuantity
                            ? ((item.quantitySold || 0) / maxQuantity) * 100
                            : 0
                        }%`,
                        height: "100%",
                        bgcolor: "primary.main",
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent>
                <Typography color="text.secondary" align="center">
                  No top selling items data available
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </>
    );
  };

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <ToggleButtonGroup
            value={customRangeMode ? null : timeRange}
            exclusive
            onChange={(e, v) => {
              if (v) {
                setCustomRangeMode(false);
                setTimeRange(v);
              }
            }}
            size="small"
            disabled={customRangeMode}
          >
            <ToggleButton value="day">Today</ToggleButton>
            <ToggleButton value="week">This Week</ToggleButton>
            <ToggleButton value="month">This Month</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant={customRangeMode ? "contained" : "outlined"}
            size="small"
            onClick={() => setCustomRangeMode((v) => !v)}
          >
            Custom Range
          </Button>
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Data Source: {debugInfo.source}
          {debugInfo.lastUpdated && ` • Last Updated: ${debugInfo.lastUpdated}`}
        </Typography>
      </Box>
      {customRangeMode && (
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <DatePicker
            selectsRange
            startDate={dateRange[0]}
            endDate={dateRange[1]}
            onChange={(update) => setDateRange(update)}
            maxDate={new Date()}
            isClearable={true}
            placeholderText="Select date range"
            dateFormat="yyyy-MM-dd"
            customInput={<TextField size="small" label="Date Range" />}
          />
        </Box>
      )}

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
