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

// GET /api/orders/:id - Get a specific order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await orderController.getOrderById(req.params.id);
    res.json(order);
  } catch (error) {
    console.error("Error getting order:", error);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: "Order not found" });
    } else {
      res.status(500).json({ error: "Failed to get order" });
    }
  }
});

// PATCH /api/orders/:id/status - Update order status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Validate status value
    const validStatuses = [
      "pending",
      "confirmed",
      "ready",
      "completed",
      "cancelled",
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
    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    if (error.message.includes("not found")) {
      res.status(404).json({ error: "Order not found" });
    } else {
      res.status(500).json({ error: "Failed to update order status" });
    }
  }
});

module.exports = router;
