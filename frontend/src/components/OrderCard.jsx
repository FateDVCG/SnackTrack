import React from "react";
import {
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  Stack,
  useTheme,
} from "@mui/material";
import { format } from "date-fns";

const OrderCard = ({ order, onStatusChange }) => {
  const theme = useTheme();

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "confirmed":
        return "info";
      case "ready":
        return "success";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getNextStatus = (currentStatus) => {
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
      elevation={1}
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderLeft: 2,
        borderColor: `${getStatusColor(order.status)}.main`,
      }}
    >
      <Stack spacing={1.5}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Typography variant="h6" sx={{ fontSize: "1.1rem" }}>
            #{order.id}
          </Typography>
          <Chip
            label={order.status}
            color={getStatusColor(order.status)}
            size="small"
            sx={{ textTransform: "capitalize" }}
          />
        </Box>

        {/* Order Info */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {format(new Date(order.created_at), "PPp")}
          </Typography>
          <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600 }}>
            $
            {typeof order.total_price === "number"
              ? order.total_price.toFixed(2)
              : "0.00"}
          </Typography>
        </Box>

        {/* Items */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
            Items:
          </Typography>
          <Stack spacing={0.5}>
            {order.items.map((item, index) => (
              <Typography
                key={index}
                variant="body2"
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "text.secondary",
                  fontSize: "0.875rem",
                }}
              >
                <span>{item.name}</span>
                <span>
                  $
                  {typeof item.price === "number"
                    ? item.price.toFixed(2)
                    : "0.00"}
                </span>
              </Typography>
            ))}
          </Stack>
        </Box>

        {/* Special Instructions */}
        {order.special_instructions && (
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              backgroundColor:
                theme.palette.mode === "dark" ? "error.dark" : "error.light",
              borderColor: "error.main",
            }}
          >
            <Typography
              variant="body2"
              color="error"
              sx={{ fontSize: "0.875rem" }}
            >
              {order.special_instructions}
            </Typography>
          </Paper>
        )}

        {/* Actions */}
        <Stack spacing={1} sx={{ mt: "auto" }}>
          {getNextStatus(order.status) && (
            <Button
              variant="contained"
              size="small"
              color={getStatusColor(order.status)}
              onClick={() =>
                onStatusChange(order.id, getNextStatus(order.status))
              }
              fullWidth
            >
              Mark as {getNextStatus(order.status)}
            </Button>
          )}
          {order.status === "pending" && (
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => onStatusChange(order.id, "cancelled")}
              fullWidth
            >
              Cancel Order
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default OrderCard;
