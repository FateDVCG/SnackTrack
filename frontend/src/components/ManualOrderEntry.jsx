import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Autocomplete,
  Grid,
  Alert,
  Divider,
} from "@mui/material";
import { menuService } from "../services/menuService";
import { CurrencyContext } from "../App";

const ManualOrderEntry = ({ onOrderSubmit, onClose }) => {
  const { currency } = useContext(CurrencyContext);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch menu items on component mount
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const items = await menuService.getMenuItems();
        setMenuItems(items);
      } catch (error) {
        console.error("Error fetching menu items:", error);
        setError("Failed to load menu items. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenuItems();
  }, []);

  // Add selected item to order
  const handleAddItem = (item) => {
    if (!item) return;

    const existingItem = selectedItems.find((i) => i.item.id === item.id);
    if (existingItem) {
      setSelectedItems(
        selectedItems.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems([...selectedItems, { item, quantity: 1 }]);
    }
  };

  // Update item quantity
  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      setSelectedItems(selectedItems.filter((i) => i.item.id !== itemId));
    } else {
      setSelectedItems(
        selectedItems.map((i) =>
          i.item.id === itemId ? { ...i, quantity: newQuantity } : i
        )
      );
    }
  };

  // Calculate total price
  const totalPrice = selectedItems.reduce(
    (sum, { item, quantity }) => sum + item.price * quantity,
    0
  );

  const formatPrice = (price) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const orderData = {
      customerName,
      customerPhone,
      type: "Phone",
      items: selectedItems.map(({ item, quantity }) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: quantity,
      })),
      totalPrice,
      deliveryAddress,
      specialInstructions,
      status: "new",
    };

    onOrderSubmit(orderData);

    // Reset form
    setSelectedItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setDeliveryAddress("");
    setSpecialInstructions("");

    // Close dialog if provided
    if (onClose) {
      onClose();
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        <Typography>Loading menu items...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h5" gutterBottom align="center" sx={{ mb: 4 }}>
        Manual Order Entry
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", gap: 4 }}>
          {/* Left Panel - Customer Information */}
          <Box sx={{ flex: 1, p: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Customer Information
            </Typography>
            <TextField
              fullWidth
              label="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Customer Phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Delivery Address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              multiline
              rows={4}
              required
              sx={{ mb: 3 }}
            />

            <Typography variant="h6" color="primary" gutterBottom>
              Additional Information
            </Typography>
            <TextField
              fullWidth
              label="Special Instructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              multiline
              rows={4}
              placeholder="Add any special instructions or notes here..."
              sx={{ mb: 3 }}
            />
          </Box>

          {/* Vertical Divider */}
          <Divider orientation="vertical" flexItem />

          {/* Right Panel - Menu Items */}
          <Box sx={{ flex: 1.2, p: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Menu Items
            </Typography>
            <Autocomplete
              options={menuItems}
              getOptionLabel={(option) =>
                `${option.name} - ${currency}${formatPrice(option.price)}`
              }
              onChange={(_, newValue) => handleAddItem(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Add Menu Item"
                  placeholder="Search and select menu items..."
                  fullWidth
                />
              )}
              sx={{ mb: 3 }}
            />

            {/* Selected Items List */}
            <Box
              sx={{
                mb: 3,
                maxHeight: "400px",
                overflowY: "auto",
                pr: 1,
              }}
            >
              {selectedItems.map(({ item, quantity }) => (
                <Box
                  key={item.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: "background.default",
                  }}
                >
                  <Typography flex={1}>
                    {item.name} - {currency}
                    {formatPrice(item.price)}
                  </Typography>
                  <TextField
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.id, parseInt(e.target.value))
                    }
                    sx={{ width: 80 }}
                    inputProps={{ min: 1 }}
                  />
                  <Typography sx={{ minWidth: 100, textAlign: "right" }}>
                    {currency}
                    {formatPrice(item.price * quantity)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Bottom Section - Total and Submit */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mt: 4,
            pt: 3,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h5" gutterBottom>
            Total: {currency}
            {formatPrice(totalPrice)}
          </Typography>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={selectedItems.length === 0}
            sx={{ minWidth: 200 }}
          >
            Create Order
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ManualOrderEntry;
