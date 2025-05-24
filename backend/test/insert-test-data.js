require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true,
  },
});

// Sample menu items
const menuItems = [
  { name: "Burger", price: 120.99 },
  { name: "Pizza", price: 150.99 },
  { name: "Fries", price: 40.99 },
  { name: "Soda", price: 25.99 },
  { name: "Salad", price: 80.99 },
  { name: "Wings", price: 90.99 },
  { name: "Ice Cream", price: 35.99 },
];

// Get random items for an order
function getRandomItems() {
  const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items
  const items = [];
  let totalPrice = 0;

  for (let i = 0; i < numItems; i++) {
    const item = menuItems[Math.floor(Math.random() * menuItems.length)];
    const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
    items.push({
      name: item.name,
      price: item.price,
      quantity: quantity,
    });
    totalPrice += item.price * quantity;
  }

  return { items, totalPrice };
}

// Get random order type
function getRandomOrderType() {
  const types = ["Dine In", "Take Out", "Delivery"];
  return types[Math.floor(Math.random() * types.length)];
}

async function setupDatabase() {
  const client = await pool.connect();
  try {
    // Add order_type column if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name='orders' AND column_name='order_type'
        ) THEN 
          ALTER TABLE orders ADD COLUMN order_type VARCHAR(50) DEFAULT 'Delivery';
        END IF;
      END $$;
    `);

    console.log("Database schema updated successfully");
  } catch (error) {
    console.error("Error updating schema:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function insertTestOrders() {
  const client = await pool.connect();
  try {
    // First ensure the schema is up to date
    await setupDatabase();

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
          order_type,
          total_price,
          items,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          `test_customer_${Math.floor(Math.random() * 20) + 1}`,
          status,
          getRandomOrderType(),
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
