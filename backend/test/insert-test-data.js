require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true,
  },
});

const sampleItems = [
  { name: "Burger", price: 9.99 },
  { name: "Pizza", price: 12.99 },
  { name: "Fries", price: 4.99 },
  { name: "Soda", price: 2.99 },
  { name: "Salad", price: 7.99 },
];

function getRandomItems() {
  const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
  const items = [];
  let totalPrice = 0;

  for (let i = 0; i < numItems; i++) {
    const item = sampleItems[Math.floor(Math.random() * sampleItems.length)];
    items.push(item);
    totalPrice += item.price;
  }

  return { items, totalPrice };
}

async function insertTestOrders() {
  const client = await pool.connect();
  try {
    // Insert orders for the last 30 days
    for (let i = 0; i < 100; i++) {
      const { items, totalPrice } = getRandomItems();
      const daysAgo = Math.floor(Math.random() * 30); // 0-30 days ago
      const hoursAgo = Math.floor(Math.random() * 24); // 0-24 hours ago

      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(date.getHours() - hoursAgo);

      const status =
        Math.random() > 0.1
          ? Math.random() > 0.2
            ? "completed"
            : "pending"
          : "cancelled";

      await client.query(
        `INSERT INTO orders (
          customer_id,
          status,
          total_price,
          items,
          created_at
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          `test_customer_${Math.floor(Math.random() * 20) + 1}`,
          status,
          totalPrice,
          JSON.stringify(items),
          date.toISOString(),
        ]
      );
    }

    console.log("Successfully inserted 100 test orders");
  } catch (error) {
    console.error("Error inserting test data:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

insertTestOrders();
