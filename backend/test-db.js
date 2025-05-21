require("dotenv").config();
const { Client } = require("pg");

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      require: true,
    },
  });

  try {
    console.log("Attempting to connect...");
    await client.connect();
    console.log("Connected successfully!");

    const result = await client.query("SELECT NOW()");
    console.log("Query result:", result.rows[0]);
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    await client.end();
  }
}

testConnection();
