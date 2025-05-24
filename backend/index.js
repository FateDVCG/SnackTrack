require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const webhookRoutes = require("./routes/webhook");
const orderRoutes = require("./routes/orders");
const analyticsRoutes = require("./routes/analytics");
const menuItemsRoutes = require("./routes/menuItems");

const app = express();
const port = process.env.PORT || 3000;

// Create a new pool using the connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true,
  },
});

// Test database connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connected successfully");
  }
});

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Basic health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "SnackTrack API is running" });
});

// Routes
app.use("/webhook", webhookRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/menu-items", menuItemsRoutes);

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

console.log("Loaded DATABASE_URL:", process.env.DATABASE_URL);

module.exports = app;
