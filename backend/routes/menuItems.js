const express = require("express");
const router = express.Router();
const menuItemModel = require("../models/menuItemModel");

// Get all menu items
router.get("/", async (req, res) => {
  try {
    const items = await menuItemModel.getAllMenuItems();
    res.json({ success: true, data: items });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch menu items" });
  }
});

// Create new menu item
router.post("/", async (req, res) => {
  try {
    const item = await menuItemModel.createMenuItem(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error("Error creating menu item:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to create menu item" });
  }
});

// Update menu item
router.put("/:id", async (req, res) => {
  try {
    const item = await menuItemModel.updateMenuItem(req.params.id, req.body);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, error: "Menu item not found" });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error("Error updating menu item:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update menu item" });
  }
});

// Get menu item by ID
router.get("/:id", async (req, res) => {
  try {
    const item = await menuItemModel.getMenuItemById(req.params.id);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, error: "Menu item not found" });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch menu item" });
  }
});

module.exports = router;
