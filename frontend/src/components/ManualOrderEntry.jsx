import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
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
  CircularProgress,
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

  // Memoized price formatter
  const formatPrice = useCallback((price) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
  }, []);

  // Fetch menu items on component mount
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching menu items...");

        const items = await menuService.getMenuItems();
        console.log("Fetched menu items:", items);

        // More detailed validation - handle both array and object responses
        if (!items) {
          throw new Error("No menu items returned from service");
        }

        // Support both array and object with data property (like MenuManager does)
        const dataArray = Array.isArray(items)
          ? items
          : Array.isArray(items?.data)
          ? items.data
          : [];

        console.log("Processed data array:", dataArray);

        if (dataArray.length === 0) {
          console.warn("Menu items array is empty");
          setError(
            "No menu items available. Please check if menu items are configured."
          );
        }

        // Validate item structure
        const validItems = dataArray.filter((item) => {
          const isValid =
            item &&
            typeof item.id !== "undefined" &&
            typeof item.name === "string" &&
            (typeof item.price === "number" || typeof item.price === "string");
          if (!isValid) {
            console.warn("Invalid menu item found:", item);
          }
          return isValid;
        });

        if (validItems.length !== dataArray.length) {
          console.warn(
            `Filtered out ${dataArray.length - validItems.length} invalid items`
          );
        }

        // Format items like MenuManager does
        const formattedItems = validItems.map((item) => ({
          ...item,
          price:
            typeof item.price === "string"
              ? parseFloat(item.price)
              : item.price,
        }));

        setMenuItems(formattedItems);
        console.log("Set menu items:", formattedItems);
      } catch (error) {
        console.error("Error fetching menu items:", error);
        setError(`Failed to load menu items: ${error.message}`);
        setMenuItems([]); // Ensure we have an empty array
      } finally {
        setLoading(false);
      }
    };
    fetchMenuItems();
  }, []);

  // Memoized add item handler
  const handleAddItem = useCallback((item) => {
    if (!item) return;

    setSelectedItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.item.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...prevItems, { item, quantity: 1 }];
      }
    });
  }, []);

  // Memoized quantity change handler
  const handleQuantityChange = useCallback((itemId, newQuantity) => {
    setSelectedItems((prevItems) => {
      if (newQuantity < 1) {
        return prevItems.filter((i) => i.item.id !== itemId);
      } else {
        return prevItems.map((i) =>
          i.item.id === itemId ? { ...i, quantity: newQuantity } : i
        );
      }
    });
  }, []);

  // Memoized total price calculation
  const totalPrice = useMemo(() => {
    return selectedItems.reduce(
      (sum, { item, quantity }) =>
        sum + (parseFloat(item.price) || 0) * quantity,
      0
    );
  }, [selectedItems]);

  // Memoized autocomplete options
  const autocompleteOptions = useMemo(() => {
    console.log("Creating autocomplete options from:", menuItems);
    return menuItems || [];
  }, [menuItems]);

  // Memoized form reset
  const resetForm = useCallback(() => {
    setSelectedItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setDeliveryAddress("");
    setSpecialInstructions("");
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    (e) => {
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
      resetForm();

      // Close dialog if provided
      if (onClose) {
        onClose();
      }
    },
    [
      customerName,
      customerPhone,
      selectedItems,
      totalPrice,
      deliveryAddress,
      specialInstructions,
      onOrderSubmit,
      onClose,
      resetForm,
    ]
  );

  if (loading) {
    return (
      <Paper sx={{ p: 3, maxWidth: 1200, mx: "auto", textAlign: "center" }}>
        <CircularProgress sx={{ mb: 2 }} />
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
              Menu Items ({menuItems.length} available)
            </Typography>
            <Autocomplete
              options={autocompleteOptions}
              getOptionLabel={(option) => {
                try {
                  return `${option.name} - ${currency}${formatPrice(
                    option.price
                  )}`;
                } catch (err) {
                  console.error("Error formatting option label:", err, option);
                  return option.name || "Unknown item";
                }
              }}
              onChange={(_, newValue) => handleAddItem(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Add Menu Item"
                  placeholder="Search and select menu items..."
                  fullWidth
                  helperText={
                    menuItems.length === 0
                      ? "No menu items available"
                      : `${menuItems.length} items available`
                  }
                />
              )}
              noOptionsText={
                menuItems.length === 0
                  ? "No menu items available"
                  : "No matching items"
              }
              sx={{ mb: 3 }}
              key={menuItems.length} // Force re-render when menuItems changes
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
                    {formatPrice((parseFloat(item.price) || 0) * quantity)}
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
