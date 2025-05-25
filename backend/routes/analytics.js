const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

/**
 * GET /api/analytics
 * Get analytics data for a specific time range or custom date range
 * Query parameters:
 * - range: 'day' | 'week' | 'month' (default: 'day')
 * - startDate: (optional, ISO string)
 * - endDate: (optional, ISO string)
 */
router.get("/", async (req, res) => {
  try {
    let { range, startDate, endDate } = req.query;

    // If custom range, validate dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start) || isNaN(end) || start > end) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid startDate or endDate. Must be valid ISO dates and start <= end.",
        });
      }
    } else {
      // Default to 'day' if range is missing or invalid
      if (!range || !["day", "week", "month"].includes(range)) {
        range = "day";
      }
    }

    const analytics = await analyticsController.getAnalytics({
      range,
      startDate,
      endDate,
    });
    res.json(analytics); // Fixed: Return the analytics directly without extra nesting
  } catch (error) {
    console.error("Analytics route error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch analytics data",
      details: error.message,
    });
  }
});

module.exports = router;
