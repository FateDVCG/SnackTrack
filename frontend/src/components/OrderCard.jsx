import React, { useContext } from "react";
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
import { CurrencyContext } from "../App";

const OrderCard = ({
  order,
  onStatusChange,
  onAccept,
  onVoid,
  isAccepted = false,
}) => {
  const theme = useTheme();
  const { currency } = useContext(CurrencyContext);

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return theme.palette.orderStatus.new;
      case "accepted":
        return theme.palette.orderStatus.accepted;
      case "finished":
        return theme.palette.orderStatus.finished;
      case "completed":
        return theme.palette.orderStatus.completed;
      case "voided":
        return theme.palette.orderStatus.voided;
      default:
        return theme.palette.grey[500];
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case "accepted":
        return "finished";
      case "finished":
        return "completed";
      default:
        return null;
    }
  };

  const getNextStatusButton = (currentStatus) => {
    switch (currentStatus) {
      case "accepted":
        return "Mark as Finished";
      case "finished":
        return "Order Complete";
      default:
        return null;
    }
  };

  // Format price to always show 2 decimal places
  const formatPrice = (price) => {
    if (typeof price === "number") {
      return price.toFixed(2);
    }
    if (typeof price === "string") {
      const num = parseFloat(price);
      return isNaN(num) ? "0.00" : num.toFixed(2);
    }
    return "0.00";
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxShadow: `0 4px 20px 0 ${getStatusColor(order.status)}40`,
        borderRadius: 4,
        transition: "all 0.3s ease",
        height: "fit-content",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 25px 0 ${getStatusColor(order.status)}60`,
        },
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontSize: "1.1rem" }}>
              #{order.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.order_type || "Delivery"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {order.customer_name || "Anonymous Customer"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.customer_phone || "No phone"}
            </Typography>
            {order.delivery_address && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  backgroundColor: "action.hover",
                  p: 1,
                  borderRadius: 1,
                }}
              >
                📍 {order.delivery_address}
              </Typography>
            )}
          </Box>
          <Chip
            label={order.status}
            sx={{
              bgcolor: `${getStatusColor(order.status)}15`,
              color: getStatusColor(order.status),
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          />
        </Box>

        {/* Order Info */}
        <Box>
          <Typography variant="body2" color="text.secondary">
            {format(new Date(order.created_at), "PPp")}
          </Typography>
          <Typography variant="h6" sx={{ fontSize: "1.1rem", fontWeight: 600 }}>
            {currency} {formatPrice(order.total_price)}
          </Typography>
        </Box>

        {/* Items */}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Items:
          </Typography>
          <Stack spacing={1}>
            {order.items.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography variant="body2">{item.name}</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    x{item.quantity || 1}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {currency} {formatPrice(item.price)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Special Instructions */}
        {order.special_instructions && (
          <Box
            sx={{
              p: 1.5,
              bgcolor: "error.main",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "error.dark",
            }}
          >
            <Typography variant="body2" sx={{ color: "white" }}>
              {order.special_instructions}
            </Typography>
          </Box>
        )}

        {/* Actions */}
        <Stack spacing={1} sx={{ mt: "auto" }}>
          {getNextStatus(order.status) && (
            <Button
              variant="contained"
              onClick={() =>
                onStatusChange(order.id, getNextStatus(order.status))
              }
              sx={{
                bgcolor: getStatusColor(getNextStatus(order.status)),
                "&:hover": {
                  bgcolor: getStatusColor(getNextStatus(order.status)),
                  filter: "brightness(0.9)",
                },
              }}
            >
              {getNextStatusButton(order.status)}
            </Button>
          )}

          {order.status === "new" && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: theme.palette.orderStatus.voided,
                  "&:hover": {
                    bgcolor: theme.palette.orderStatus.voided,
                    filter: "brightness(0.9)",
                  },
                }}
                onClick={() => onVoid(order.id)}
              >
                Void
              </Button>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: theme.palette.orderStatus.accepted,
                  "&:hover": {
                    bgcolor: theme.palette.orderStatus.accepted,
                    filter: "brightness(0.9)",
                  },
                }}
                onClick={() => onAccept(order.id)}
              >
                Accept Order
              </Button>
            </Box>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default OrderCard;
