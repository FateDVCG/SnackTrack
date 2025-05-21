const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

/**
 * GET /api/analytics
 * Get analytics data for a specific time range
 * Query parameters:
 * - range: 'day' | 'week' | 'month' (default: 'day')
 */
router.get("/", async (req, res) => {
  try {
    const range = req.query.range || "day";

    // Validate range parameter
    if (!["day", "week", "month"].includes(range)) {
      return res.status(400).json({
        error: "Invalid range parameter. Use day, week, or month.",
      });
    }

    const analytics = await analyticsController.getAnalytics(range);
    res.json(analytics);
  } catch (error) {
    console.error("Analytics route error:", error);
    res.status(500).json({
      error: "Failed to fetch analytics data",
      details: error.message,
    });
  }
});

module.exports = router;
