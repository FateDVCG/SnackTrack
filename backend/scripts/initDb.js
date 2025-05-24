require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

async function initializeDatabase() {
  try {
    // Read schema file
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, "../db/init.sql"),
      "utf8"
    );

    // Read test data file
    const testDataSQL = fs.readFileSync(
      path.join(__dirname, "../db/sample_data.sql"),
      "utf8"
    );

    // Execute schema
    console.log("Creating database schema...");
    await db.query(schemaSQL);
    console.log("Schema created successfully");

    // Execute test data
    console.log("Inserting test data...");
    await db.query(testDataSQL);
    console.log("Test data inserted successfully");

    console.log("Database initialization completed");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

initializeDatabase();
