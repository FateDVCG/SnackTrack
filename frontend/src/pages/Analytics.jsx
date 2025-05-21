import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
} from "@mui/material";
import { analyticsService } from "../services/analyticsService";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("day");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getAnalytics(timeRange);
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch analytics"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const handleTimeRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading analytics...</Typography>
        <LinearProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">Error: {error}</Typography>
      </Container>
    );
  }

  const { sales = {}, topSellingItems = [] } = analytics || {};

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Sales Analytics
        </Typography>

        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          sx={{ mb: 3 }}
        >
          <ToggleButton value="day">Today</ToggleButton>
          <ToggleButton value="week">This Week</ToggleButton>
          <ToggleButton value="month">This Month</ToggleButton>
        </ToggleButtonGroup>

        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid sx={{ width: { xs: "100%", md: "33.33%" }, p: 1 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Orders
                </Typography>
                <Typography variant="h4">{sales.totalOrders || 0}</Typography>
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                  Completion Rate: {sales.completionRate || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid sx={{ width: { xs: "100%", md: "33.33%" }, p: 1 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4">
                  ${sales.totalRevenue?.toFixed(2) || "0.00"}
                </Typography>
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                  Completed Orders: {sales.completedOrders || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid sx={{ width: { xs: "100%", md: "33.33%" }, p: 1 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Order Value
                </Typography>
                <Typography variant="h4">
                  ${sales.averageOrderValue?.toFixed(2) || "0.00"}
                </Typography>
                <Typography color="textSecondary" sx={{ mt: 1 }}>
                  Cancelled Orders: {sales.cancelledOrders || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Top Items Section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Top Selling Items
          </Typography>
          <Grid container spacing={2}>
            {topSellingItems.map((item, index) => (
              <Grid key={index} sx={{ width: { xs: "100%", md: "50%" }, p: 1 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{item.name}</Typography>
                    <Typography color="textSecondary">
                      Quantity Sold: {item.quantitySold}
                    </Typography>
                    <Typography color="textSecondary">
                      Revenue: ${item.revenue.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default Analytics;
