require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true,
  },
});

async function setupDatabase() {
  try {
    // Read the SQL file
    const sqlFile = path.join(__dirname, "db", "init.sql");
    const sql = fs.readFileSync(sqlFile, "utf8");

    // Connect to the database
    const client = await pool.connect();

    try {
      // Execute the SQL
      await client.query(sql);
      console.log("Database setup completed successfully");
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (err) {
    console.error("Error setting up database:", err);
    throw err;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the setup
setupDatabase().catch(console.error);
