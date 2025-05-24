const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// GET /api/orders - Get all orders with optional filters
router.get("/", async (req, res) => {
  try {
    // Extract filter parameters from query string
    const filters = {
      status: req.query.status,
      customerId: req.query.customerId,
      dateRange: req.query.dateRange ? JSON.parse(req.query.dateRange) : null,
    };

    const orders = await orderController.getOrders(filters);
    res.json(orders);
  } catch (error) {
    console.error("Error getting orders:", error);
    res.status(500).json({ error: "Failed to get orders" });
  }
});

// POST /api/orders - Create a new order
router.post("/", async (req, res) => {
  try {
    // Validate required fields
    const { customerPhone, items, deliveryAddress } = req.body;
    if (!customerPhone || !items || !deliveryAddress) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["customerPhone", "items", "deliveryAddress"],
      });
    }

    // Validate items structure
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Items must be a non-empty array",
      });
    }

    const order = await orderController.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// GET /api/orders/:id - Get a specific order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await orderController.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error getting order:", error);
    res.status(500).json({ error: "Failed to get order" });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Validate status value
    const validStatuses = [
      "new",
      "accepted",
      "finished",
      "completed",
      "voided",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
        validStatuses,
      });
    }

    const order = await orderController.updateOrderStatus(
      req.params.id,
      status
    );
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

module.exports = router;
