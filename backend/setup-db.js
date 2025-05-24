require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true,
  },
});

// SQL statements to set up the database
const setupStatements = [
  // Drop existing tables and triggers
  "DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;",
  "DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;",
  "DROP TABLE IF EXISTS orders CASCADE;",
  "DROP TABLE IF EXISTS menu_items CASCADE;",

  // Create orders table
  `CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    order_type VARCHAR(50) DEFAULT 'Delivery',
    total_price DECIMAL(10,2) NOT NULL,
    items JSONB NOT NULL,
    delivery_address TEXT,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // Create menu_items table
  `CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_tagalog VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    aliases JSONB DEFAULT '[]',
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // Create indexes
  "CREATE INDEX idx_orders_customer_id ON orders(customer_id);",
  "CREATE INDEX idx_orders_status ON orders(status);",
  "CREATE INDEX idx_orders_created_at ON orders(created_at);",
  "CREATE INDEX idx_orders_type ON orders(order_type);",
  "CREATE INDEX idx_menu_items_name ON menu_items(name);",
  "CREATE INDEX idx_menu_items_name_tagalog ON menu_items(name_tagalog);",

  // Create timestamp update function
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
       NEW.updated_at = CURRENT_TIMESTAMP;
       RETURN NEW;
   END;
   $$ language 'plpgsql';`,

  // Create triggers
  `CREATE TRIGGER update_orders_updated_at
   BEFORE UPDATE ON orders
   FOR EACH ROW
   EXECUTE FUNCTION update_updated_at_column();`,

  `CREATE TRIGGER update_menu_items_updated_at
   BEFORE UPDATE ON menu_items
   FOR EACH ROW
   EXECUTE FUNCTION update_updated_at_column();`,

  // Insert sample menu items
  `INSERT INTO menu_items (name, name_tagalog, price, category, aliases) VALUES
    ('Burger', 'Hamburger', 120.99, 'Main Dishes', '["burger", "hamburger", "beefburger"]'),
    ('Fried Chicken', 'Pritong Manok', 150.99, 'Main Dishes', '["chicken", "manok", "pritong manok"]'),
    ('French Fries', 'Pritong Patatas', 40.99, 'Sides', '["fries", "patatas", "chips"]'),
    ('Rice', 'Kanin', 20.99, 'Sides', '["rice", "kanin", "bigas"]'),
    ('Soft Drink', 'Softdrinks', 35.99, 'Beverages', '["coke", "pepsi", "soda", "softdrinks"]'),
    ('Spaghetti', 'Espageti', 89.99, 'Main Dishes', '["pasta", "noodles", "espageti"]'),
    ('Chicken Wings', 'Pakpak ng Manok', 129.99, 'Main Dishes', '["wings", "hot wings", "pakpak"]'),
    ('Ice Cream', 'Sorbetes', 45.99, 'Desserts', '["ice cream", "sorbetes", "dessert"]');`,
];

async function setupDatabase() {
  const client = await pool.connect();
  console.log("Connected to database");

  try {
    // Execute each statement
    for (const statement of setupStatements) {
      try {
        await client.query(statement);
        console.log("Executed statement successfully");
      } catch (err) {
        console.warn("Warning executing statement:", err.message);
      }
    }

    // Verify tables were created
    console.log("\nVerifying database setup:");

    // Check orders table
    const ordersResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
      ORDER BY ordinal_position;
    `);
    console.log("\nOrders table columns:");
    ordersResult.rows.forEach((col) => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });

    // Check menu_items table
    const menuItemsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'menu_items'
      ORDER BY ordinal_position;
    `);
    console.log("\nMenu items table columns:");
    menuItemsResult.rows.forEach((col) => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });

    console.log("\nDatabase setup completed successfully");
  } catch (err) {
    console.error("Error setting up database:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupDatabase().catch(console.error);
