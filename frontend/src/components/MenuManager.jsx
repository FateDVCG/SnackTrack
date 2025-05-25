import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { menuService } from "../services/menuService";
import { CurrencyContext } from "../App";

const MenuManager = () => {
  const { currency } = useContext(CurrencyContext);
  const [menuItems, setMenuItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    name_tagalog: "",
    price: "",
    category: "",
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await menuService.getMenuItems();
      // Support both array and object with data property
      const dataArray = Array.isArray(items)
        ? items
        : Array.isArray(items?.data)
        ? items.data
        : [];
      const formattedItems = dataArray.map((item) => ({
        ...item,
        price:
          typeof item.price === "string" ? parseFloat(item.price) : item.price,
      }));
      setMenuItems(formattedItems);
    } catch (error) {
      setError("Failed to load menu items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        name_tagalog: item.name_tagalog,
        price: item.price.toString(),
        category: item.category || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        name_tagalog: "",
        price: "",
        category: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({
      name: "",
      name_tagalog: "",
      price: "",
      category: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
      };

      if (editingItem) {
        await menuService.updateMenuItem(editingItem.id, itemData);
      } else {
        await menuService.createMenuItem(itemData);
      }

      handleCloseDialog();
      fetchMenuItems();
    } catch (error) {
      console.error("Error saving menu item:", error);
      setError("Failed to save menu item. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await menuService.deleteMenuItem(id);
        fetchMenuItems();
      } catch (error) {
        console.error("Error deleting menu item:", error);
        setError("Failed to delete menu item. Please try again.");
      }
    }
  };

  const formatPrice = (price) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">Menu Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Menu Item
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography>Loading menu items...</Typography>
      ) : menuItems.length === 0 ? (
        <Typography>No menu items found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Name (Tagalog)</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.name_tagalog}</TableCell>
                  <TableCell>
                    {currency}
                    {formatPrice(item.price)}
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleOpenDialog(item)}
                      size="small"
                      data-testid="edit-button"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(item.id)}
                      size="small"
                      color="error"
                      data-testid="delete-button"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingItem ? "Edit Menu Item" : "Add Menu Item"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: "grid", gap: 2 }}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <TextField
                fullWidth
                label="Name (Tagalog)"
                value={formData.name_tagalog}
                onChange={(e) =>
                  setFormData({ ...formData, name_tagalog: e.target.value })
                }
                required
              />
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
                inputProps={{ step: "0.01" }}
              />
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingItem ? "Save" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default MenuManager;
