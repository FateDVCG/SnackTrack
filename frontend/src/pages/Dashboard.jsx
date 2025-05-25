import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Badge,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Dialog,
} from "@mui/material";
import OrderCard from "../components/OrderCard";
import ManualOrderEntry from "../components/ManualOrderEntry";
import { orderService } from "../services/orderService";
import { CurrencyContext } from "../App";
import AddIcon from "@mui/icons-material/Add";

const Dashboard = () => {
  // State for all orders
  const [orders, setOrders] = useState([]);

  // State for filters
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("accepted");

  // State for manual entry dialog
  const [manualEntryOpen, setManualEntryOpen] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const { currency } = useContext(CurrencyContext);

  // Fetch orders on mount and poll
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await orderService.getOrders();
      const fetchedOrders = Array.isArray(response) ? response : response.data;
      setOrders(fetchedOrders);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch orders");
      setLoading(false);
    }
  }, []);

  // Memoized filtered lists
  const newOrders = useMemo(
    () => orders.filter((o) => o.status === "new"),
    [orders]
  );
  const acceptedOrders = useMemo(
    () => orders.filter((o) => o.status === "accepted"),
    [orders]
  );
  const finishedOrders = useMemo(
    () => orders.filter((o) => o.status === "finished"),
    [orders]
  );
  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "completed"),
    [orders]
  );
  const voidedOrders = useMemo(
    () => orders.filter((o) => o.status === "voided"),
    [orders]
  );

  const filteredNewOrders = useMemo(
    () =>
      newOrders.filter(
        (order) =>
          orderTypeFilter === "all" ||
          order.order_type?.toLowerCase() === orderTypeFilter.toLowerCase()
      ),
    [newOrders, orderTypeFilter]
  );

  // Optimistic UI: store previous orders for rollback
  const [prevOrders, setPrevOrders] = useState([]);

  // Memoized callbacks
  const handleOrderUpdate = useCallback((updatedOrder) => {
    setOrders((prevOrders) => {
      // Remove old order and add updated one
      const filtered = prevOrders.filter((o) => o.id !== updatedOrder.id);
      return [...filtered, updatedOrder];
    });
  }, []);

  // Optimistic status change
  const handleStatusChange = useCallback(
    async (orderId, newStatus) => {
      // Save previous state for rollback
      setPrevOrders(orders);
      // Optimistically update UI
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      try {
        const updatedOrder = await orderService.updateOrderStatus(
          orderId,
          newStatus
        );
        handleOrderUpdate(updatedOrder);
        showSnackbar(`Order ${newStatus} successfully`, "success");
      } catch (err) {
        // Rollback
        setOrders(prevOrders);
        showSnackbar("Failed to update order status", "error");
      }
    },
    [orders, handleOrderUpdate, prevOrders]
  );

  // Optimistic accept order
  const handleAcceptOrder = useCallback(
    async (orderId) => {
      setPrevOrders(orders);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "accepted" } : o))
      );
      try {
        const updatedOrder = await orderService.updateOrderStatus(
          orderId,
          "accepted"
        );
        handleOrderUpdate(updatedOrder);
        showSnackbar("Order accepted successfully", "success");
      } catch (err) {
        setOrders(prevOrders);
        showSnackbar("Failed to accept order", "error");
      }
    },
    [orders, handleOrderUpdate, prevOrders]
  );

  // Optimistic void order
  const handleVoidOrder = useCallback(
    async (orderId) => {
      setPrevOrders(orders);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "voided" } : o))
      );
      try {
        const updatedOrder = await orderService.updateOrderStatus(
          orderId,
          "voided"
        );
        handleOrderUpdate(updatedOrder);
        showSnackbar("Order voided successfully", "success");
      } catch (err) {
        setOrders(prevOrders);
        showSnackbar("Failed to void order", "error");
      }
    },
    [orders, handleOrderUpdate, prevOrders]
  );

  const handleManualOrderSubmit = useCallback(async (orderData) => {
    try {
      const newOrder = await orderService.createOrder(orderData);
      setOrders((prev) => [...prev, newOrder]);
      setManualEntryOpen(false);
      showSnackbar("Order created successfully", "success");
    } catch (err) {
      showSnackbar("Failed to create order", "error");
    }
  }, []);

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

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
      {/* Add Order Button */}
      <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setManualEntryOpen(true)}
        >
          Add Manual Order
        </Button>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 2,
          p: 2,
          flex: 1,
          overflow: "hidden",
        }}
      >
        {/* Left Panel - New Orders */}
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: "100%",
          }}
        >
          {/* Order Type Tabs */}
          <Tabs
            value={orderTypeFilter}
            onChange={(e, v) => setOrderTypeFilter(v)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              label={
                <Badge
                  badgeContent={newOrders.length}
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": {
                      right: -3,
                      top: 3,
                      padding: "0 4px",
                      minWidth: "20px",
                      height: "20px",
                    },
                  }}
                >
                  <Box sx={{ pr: 2 }}>All</Box>
                </Badge>
              }
              value="all"
            />
            <Tab
              label={
                <Badge
                  badgeContent={
                    newOrders.filter((o) => o.order_type === "Dine In").length
                  }
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": {
                      right: -3,
                      top: 3,
                      padding: "0 4px",
                      minWidth: "20px",
                      height: "20px",
                    },
                  }}
                >
                  <Box sx={{ pr: 2 }}>Dine In</Box>
                </Badge>
              }
              value="dine_in"
            />
            <Tab
              label={
                <Badge
                  badgeContent={
                    newOrders.filter((o) => o.order_type === "Take Out").length
                  }
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": {
                      right: -3,
                      top: 3,
                      padding: "0 4px",
                      minWidth: "20px",
                      height: "20px",
                    },
                  }}
                >
                  <Box sx={{ pr: 2 }}>Take Out</Box>
                </Badge>
              }
              value="take_out"
            />
            <Tab
              label={
                <Badge
                  badgeContent={
                    newOrders.filter((o) => o.order_type === "Delivery").length
                  }
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": {
                      right: -3,
                      top: 3,
                      padding: "0 4px",
                      minWidth: "20px",
                      height: "20px",
                    },
                  }}
                >
                  <Box sx={{ pr: 2 }}>Delivery</Box>
                </Badge>
              }
              value="delivery"
            />
          </Tabs>

          {/* New Orders List */}
          <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 2,
                "& .MuiPaper-root": {
                  background: (theme) => `linear-gradient(135deg, 
                    ${theme.palette.background.paper} 0%, 
                    ${theme.palette.background.paper}80 100%)`,
                  boxShadow: (theme) =>
                    `0 8px 32px 0 ${theme.palette.primary.main}20`,
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: (theme) =>
                      `0 12px 40px 0 ${theme.palette.primary.main}30`,
                  },
                },
              }}
            >
              {filteredNewOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAccept={handleAcceptOrder}
                  onVoid={handleVoidOrder}
                />
              ))}
            </Box>
          </Box>
        </Paper>

        {/* Right Panel - Order Status */}
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: "100%",
          }}
        >
          {/* Status Tabs */}
          <Tabs
            value={statusFilter}
            onChange={(e, v) => setStatusFilter(v)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              label={
                <Badge
                  badgeContent={acceptedOrders.length}
                  color="warning"
                  sx={{
                    "& .MuiBadge-badge": {
                      right: -3,
                      top: 3,
                      padding: "0 4px",
                      minWidth: "20px",
                      height: "20px",
                    },
                  }}
                >
                  <Box sx={{ pr: 2 }}>Accepted</Box>
                </Badge>
              }
              value="accepted"
            />
            <Tab
              label={
                <Badge
                  badgeContent={finishedOrders.length}
                  color="info"
                  sx={{
                    "& .MuiBadge-badge": {
                      right: -3,
                      top: 3,
                      padding: "0 4px",
                      minWidth: "20px",
                      height: "20px",
                    },
                  }}
                >
                  <Box sx={{ pr: 2 }}>Finished</Box>
                </Badge>
              }
              value="finished"
            />
            <Tab
              label={
                <Badge
                  badgeContent={completedOrders.length}
                  color="success"
                  sx={{
                    "& .MuiBadge-badge": {
                      right: -3,
                      top: 3,
                      padding: "0 4px",
                      minWidth: "20px",
                      height: "20px",
                    },
                  }}
                >
                  <Box sx={{ pr: 2 }}>Completed</Box>
                </Badge>
              }
              value="completed"
            />
            <Tab
              label={
                <Badge
                  badgeContent={voidedOrders.length}
                  color="default"
                  sx={{
                    "& .MuiBadge-badge": {
                      right: -3,
                      top: 3,
                      padding: "0 4px",
                      minWidth: "20px",
                      height: "20px",
                    },
                  }}
                >
                  <Box sx={{ pr: 2 }}>Voided</Box>
                </Badge>
              }
              value="voided"
            />
          </Tabs>

          {/* Status-filtered Orders */}
          <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 2,
              }}
            >
              {statusFilter === "accepted" &&
                acceptedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              {statusFilter === "finished" &&
                finishedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              {statusFilter === "completed" &&
                completedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              {statusFilter === "voided" &&
                voidedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Manual Entry Dialog */}
      <Dialog
        open={manualEntryOpen}
        onClose={() => setManualEntryOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <ManualOrderEntry onOrderSubmit={handleManualOrderSubmit} />
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
