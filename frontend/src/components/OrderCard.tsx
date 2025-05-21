import React from "react";
import { Paper, Typography, Button, Box } from "@mui/material";
import { format } from "date-fns";

interface OrderItem {
  name: string;
  price: number;
}

interface Order {
  id: string;
  customer_id: string;
  status: "pending" | "confirmed" | "ready" | "completed" | "cancelled";
  total_price: number;
  items: OrderItem[];
  created_at: string;
  special_instructions?: string;
}

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: Order["status"]) => void;
}

const OrderCard = ({ order, onStatusChange }: OrderCardProps) => {
  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "warning.main";
      case "confirmed":
        return "info.main";
      case "ready":
        return "success.main";
      case "completed":
        return "success.dark";
      case "cancelled":
        return "error.main";
      default:
        return "text.primary";
    }
  };

  const getNextStatus = (
    currentStatus: Order["status"]
  ): Order["status"] | null => {
    switch (currentStatus) {
      case "pending":
        return "confirmed";
      case "confirmed":
        return "ready";
      case "ready":
        return "completed";
      default:
        return null;
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Order #{order.id}
      </Typography>

      <Typography variant="body2" sx={{ color: getStatusColor(order.status) }}>
        Status: {order.status}
      </Typography>

      <Typography variant="body2">
        Total: ${order.total_price.toFixed(2)}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Time: {format(new Date(order.created_at), "PPp")}
      </Typography>

      <Box sx={{ mt: 1, mb: 1 }}>
        <Typography variant="body2" component="div">
          Items:
          <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
            {order.items.map((item, index) => (
              <li key={index}>
                {item.name} - ${item.price.toFixed(2)}
              </li>
            ))}
          </ul>
        </Typography>
      </Box>

      {order.special_instructions && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          Note: {order.special_instructions}
        </Typography>
      )}

      <Box sx={{ mt: "auto", pt: 2 }}>
        {getNextStatus(order.status) && (
          <Button
            variant="contained"
            fullWidth
            onClick={() =>
              onStatusChange(order.id, getNextStatus(order.status)!)
            }
          >
            Mark as {getNextStatus(order.status)}
          </Button>
        )}

        {order.status === "pending" && (
          <Button
            variant="outlined"
            color="error"
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => onStatusChange(order.id, "cancelled")}
          >
            Cancel Order
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default OrderCard;
