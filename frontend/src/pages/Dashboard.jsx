import React, { useState, useEffect, useContext } from "react";
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
  // State for orders
  const [newOrders, setNewOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [finishedOrders, setFinishedOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [voidedOrders, setVoidedOrders] = useState([]);

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

  useEffect(() => {
    fetchOrders();
    // Set up polling for new orders
    const interval = setInterval(fetchOrders, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getOrders();
      // Support both array and wrapped object response
      const orders = Array.isArray(response) ? response : response.data;

      // Sort orders by status
      setNewOrders(orders.filter((order) => order.status === "new"));
      setAcceptedOrders(orders.filter((order) => order.status === "accepted"));
      setFinishedOrders(orders.filter((order) => order.status === "finished"));
      setCompletedOrders(
        orders.filter((order) => order.status === "completed")
      );
      setVoidedOrders(orders.filter((order) => order.status === "voided"));

      setLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to fetch orders");
      setLoading(false);
    }
  };

  const handleOrderUpdate = (updatedOrder) => {
    // Remove order from its current status list
    setNewOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
    setAcceptedOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
    setFinishedOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
    setCompletedOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
    setVoidedOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));

    // Add order to its new status list
    switch (updatedOrder.status) {
      case "accepted":
        setAcceptedOrders((prev) => [...prev, updatedOrder]);
        break;
      case "finished":
        setFinishedOrders((prev) => [...prev, updatedOrder]);
        break;
      case "completed":
        setCompletedOrders((prev) => [...prev, updatedOrder]);
        break;
      case "voided":
        setVoidedOrders((prev) => [...prev, updatedOrder]);
        break;
      default:
        break;
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const updatedOrder = await orderService.updateOrderStatus(
        orderId,
        newStatus
      );
      handleOrderUpdate(updatedOrder);
      showSnackbar(`Order ${newStatus} successfully`, "success");
    } catch (err) {
      console.error("Error updating order status:", err);
      showSnackbar("Failed to update order status", "error");
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const updatedOrder = await orderService.updateOrderStatus(
        orderId,
        "accepted"
      );
      handleOrderUpdate(updatedOrder);
      showSnackbar("Order accepted successfully", "success");
    } catch (err) {
      console.error("Error accepting order:", err);
      showSnackbar("Failed to accept order", "error");
    }
  };

  const handleVoidOrder = async (orderId) => {
    try {
      const updatedOrder = await orderService.updateOrderStatus(
        orderId,
        "voided"
      );
      handleOrderUpdate(updatedOrder);
      showSnackbar("Order voided successfully", "success");
    } catch (err) {
      console.error("Error voiding order:", err);
      showSnackbar("Failed to void order", "error");
    }
  };

  const handleManualOrderSubmit = async (orderData) => {
    try {
      const newOrder = await orderService.createOrder(orderData);
      setNewOrders((prev) => [...prev, newOrder]);
      setManualEntryOpen(false);
      showSnackbar("Order created successfully", "success");
    } catch (err) {
      console.error("Error creating order:", err);
      showSnackbar("Failed to create order", "error");
    }
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const filteredNewOrders = newOrders.filter(
    (order) =>
      orderTypeFilter === "all" ||
      order.order_type?.toLowerCase() === orderTypeFilter.toLowerCase()
  );

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
