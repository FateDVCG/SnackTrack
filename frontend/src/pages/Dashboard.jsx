import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  TextField,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Skeleton,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Badge,
  Pagination,
  Chip,
  Button,
  Divider,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import { orderService } from "../services/orderService";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [page, setPage] = useState(1);
  const ordersPerPage = 10;

  // Filter and sort states
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Active status sections configuration
  const activeStatusSections = [
    {
      status: "pending",
      label: "Pending Orders",
      color: "warning.main",
      actionLabel: "MARK AS CONFIRMED",
    },
    {
      status: "confirmed",
      label: "Confirmed Orders",
      color: "info.main",
      actionLabel: "MARK AS READY",
    },
    {
      status: "ready",
      label: "Ready for Pickup",
      color: "success.main",
      actionLabel: "MARK AS COMPLETED",
    },
  ];

  const completedStatusSection = {
    status: "completed",
    label: "Completed Orders",
    color: "success.dark",
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const data = await orderService.getOrders();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      showSnackbar("Failed to fetch orders", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(fetchOrders, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Refresh orders after update
      showSnackbar(`Order #${orderId} marked as ${newStatus}`, "success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update order status"
      );
      showSnackbar("Failed to update order status", "error");
    }
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    showSnackbar(
      notificationsEnabled ? "Notifications disabled" : "Notifications enabled",
      "info"
    );
  };

  // Filter and sort functions
  const filterOrders = (orders) => {
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const hasMatchingItem = order.items.some((item) =>
          item.name.toLowerCase().includes(searchLower)
        );
        const orderIdMatch = order.id.toString().includes(searchLower);
        return hasMatchingItem || orderIdMatch;
      }

      return true;
    });
  };

  const sortOrders = (orders) => {
    return [...orders].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "highest":
          return b.total_price - a.total_price;
        case "lowest":
          return a.total_price - b.total_price;
        default:
          return 0;
      }
    });
  };

  // Group orders by status
  const groupOrdersByStatus = (orders) => {
    const groups = {
      pending: [],
      confirmed: [],
      ready: [],
      completed: [],
      cancelled: [],
    };

    orders.forEach((order) => {
      if (groups[order.status]) {
        groups[order.status].push(order);
      }
    });

    return groups;
  };

  // Process orders through filters and sorting
  const filteredOrders = filterOrders(orders);
  const sortedOrders = sortOrders(filteredOrders);

  // Paginate orders
  const paginatedOrders = sortedOrders.slice(
    (page - 1) * ordersPerPage,
    page * ordersPerPage
  );
  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage);

  const groupedOrders = groupOrdersByStatus(paginatedOrders);

  // Format price safely
  const formatPrice = (price) => {
    const numPrice = Number(price);
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
  };

  // Loading skeleton
  if (loading) {
    return (
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, height: "100vh", p: 3 }}>
        <Skeleton variant="text" width="300px" height={60} />
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            {[1, 2, 3].map((i) => (
              <Grid key={i} flex={1}>
                <Skeleton variant="rectangular" height={56} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth={false}>
        <Typography color="error">Error: {error}</Typography>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: (theme) => theme.palette.grey[100],
        pt: 3,
        pb: 3,
      }}
    >
      <Container maxWidth={false} sx={{ px: 3 }}>
        {refreshing && (
          <Box
            sx={{
              width: "100%",
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 9999,
            }}
          >
            <LinearProgress />
          </Box>
        )}

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
            Order Dashboard
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip
              title={
                notificationsEnabled
                  ? "Disable notifications"
                  : "Enable notifications"
              }
            >
              <IconButton
                onClick={toggleNotifications}
                color={notificationsEnabled ? "primary" : "default"}
                size="small"
              >
                {notificationsEnabled ? (
                  <NotificationsIcon />
                ) : (
                  <NotificationsOffIcon />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid flex={1}>
            <TextField
              fullWidth
              size="small"
              label="Search orders"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID or item name"
            />
          </Grid>
          <Grid flex={1}>
            <Paper sx={{ p: 0.5 }}>
              <ToggleButtonGroup
                value={statusFilter}
                exclusive
                onChange={(e, newValue) => {
                  if (newValue !== null) {
                    setStatusFilter(newValue);
                    setPage(1);
                  }
                }}
                fullWidth
                size="small"
              >
                <ToggleButton value="all">All Active</ToggleButton>
                <ToggleButton value="pending">Pending</ToggleButton>
                <ToggleButton value="confirmed">Confirmed</ToggleButton>
                <ToggleButton value="ready">Ready</ToggleButton>
                <ToggleButton value="completed">Completed</ToggleButton>
              </ToggleButtonGroup>
            </Paper>
          </Grid>
          <Grid flex={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="highest">Highest Amount</MenuItem>
                <MenuItem value="lowest">Lowest Amount</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Orders Count and Pagination */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="subtitle1">
            Showing {paginatedOrders.length} of {sortedOrders.length} orders
          </Typography>
          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
              size="small"
            />
          )}
        </Box>

        {/* Active Orders */}
        {statusFilter !== "completed" && (
          <Grid container spacing={3}>
            {activeStatusSections.map(
              ({ status, label, color, actionLabel }) => {
                const statusOrders =
                  statusFilter === "all"
                    ? groupedOrders[status]
                    : status === statusFilter
                    ? groupedOrders[status]
                    : [];

                if (!statusOrders?.length) return null;

                return (
                  <Grid key={status} style={{ width: "100%" }}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 3,
                        mb: 3,
                        borderLeft: 6,
                        borderColor: color,
                        backgroundColor: "white",
                      }}
                    >
                      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                        {label} ({statusOrders?.length || 0})
                      </Typography>
                      <Grid container spacing={3}>
                        {statusOrders?.map((order) => (
                          <Grid
                            key={order.id}
                            style={{ width: "25%", padding: "12px" }}
                          >
                            <Paper
                              elevation={1}
                              sx={{
                                p: 2,
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                              }}
                            >
                              <Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 1,
                                  }}
                                >
                                  <Typography variant="h6">
                                    #{order.id}
                                  </Typography>
                                  <Chip
                                    label={
                                      order.status.charAt(0).toUpperCase() +
                                      order.status.slice(1)
                                    }
                                    color={
                                      order.status === "pending"
                                        ? "warning"
                                        : order.status === "confirmed"
                                        ? "info"
                                        : order.status === "ready"
                                        ? "success"
                                        : "default"
                                    }
                                    size="small"
                                  />
                                </Box>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 2 }}
                                >
                                  {new Date(order.created_at).toLocaleString()}
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ mb: 2 }}>
                                  {order.items.map((item, index) => (
                                    <Box
                                      key={index}
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        mb: 1,
                                      }}
                                    >
                                      <Typography variant="body2">
                                        {item.name}
                                      </Typography>
                                      <Typography variant="body2">
                                        ${formatPrice(item.price)}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mb: 2,
                                  }}
                                >
                                  <Typography variant="subtitle2">
                                    Total:
                                  </Typography>
                                  <Typography variant="subtitle2">
                                    ${formatPrice(order.total_price)}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                  mt: 2,
                                }}
                              >
                                <Button
                                  variant="contained"
                                  color={
                                    status === "pending"
                                      ? "warning"
                                      : status === "confirmed"
                                      ? "info"
                                      : "success"
                                  }
                                  fullWidth
                                  onClick={() =>
                                    handleStatusChange(
                                      order.id,
                                      status === "pending"
                                        ? "confirmed"
                                        : status === "confirmed"
                                        ? "ready"
                                        : "completed"
                                    )
                                  }
                                >
                                  {actionLabel}
                                </Button>
                                {status === "pending" && (
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    fullWidth
                                    onClick={() =>
                                      handleStatusChange(order.id, "cancelled")
                                    }
                                  >
                                    CANCEL ORDER
                                  </Button>
                                )}
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Grid>
                );
              }
            )}
          </Grid>
        )}

        {/* Completed Orders */}
        {(statusFilter === "completed" || statusFilter === "all") &&
          groupedOrders.completed?.length > 0 && (
            <Grid container spacing={3}>
              <Grid style={{ width: "100%" }}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    mb: 3,
                    borderLeft: 6,
                    borderColor: completedStatusSection.color,
                    backgroundColor: "white",
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    {completedStatusSection.label} (
                    {groupedOrders.completed?.length || 0})
                  </Typography>
                  <Grid container spacing={3}>
                    {groupedOrders.completed?.map((order) => (
                      <Grid
                        key={order.id}
                        style={{ width: "25%", padding: "12px" }}
                      >
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <Typography variant="h6">#{order.id}</Typography>
                            <Chip
                              label="Completed"
                              color="success"
                              size="small"
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            {new Date(order.created_at).toLocaleString()}
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          <Box sx={{ mb: 2 }}>
                            {order.items.map((item, index) => (
                              <Box
                                key={index}
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  mb: 1,
                                }}
                              >
                                <Typography variant="body2">
                                  {item.name}
                                </Typography>
                                <Typography variant="body2">
                                  ${formatPrice(item.price)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                          <Divider sx={{ mb: 2 }} />
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="subtitle2">Total:</Typography>
                            <Typography variant="subtitle2">
                              ${formatPrice(order.total_price)}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}

        {/* No Results */}
        {sortedOrders.length === 0 && (
          <Paper sx={{ p: 4, textAlign: "center", mt: 2 }}>
            <Typography variant="h6">
              No orders found matching your criteria
            </Typography>
          </Paper>
        )}

        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
              size="small"
            />
          </Box>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Dashboard;
