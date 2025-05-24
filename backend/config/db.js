const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test the connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Error connecting to Supabase:", err);
  } else {
    console.log("Successfully connected to Supabase");
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
