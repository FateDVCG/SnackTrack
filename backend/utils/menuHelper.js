const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true,
  },
});

async function getMenuItems() {
  const query = `
    SELECT * FROM menu_items 
    WHERE available = true 
    ORDER BY category, name
  `;

  const { rows } = await pool.query(query);
  return rows;
}

async function generateMenuMessage() {
  const items = await getMenuItems();

  // Group items by category
  const categorizedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // Build menu message
  let message = "🍽️ Welcome to SnackTrack! Here's our menu:\n\n";

  // Add categories and items
  for (const [category, items] of Object.entries(categorizedItems)) {
    message += `📌 ${category}\n`;
    items.forEach((item) => {
      message += `• ${item.name} - ₱${item.price.toFixed(2)}\n`;
    });
    message += "\n";
  }

  // Add ordering instructions
  message += "To place an order, please send your order in this format:\n\n";
  message += "Name: (Your Name)\n";
  message += "Order: (Item Name) x(Quantity)\n";
  message += "Delivery Address: (Your Address)\n";
  message += "Special Instructions: (Optional)\n\n";
  message += "Example:\n";
  message += "Name: John Doe\n";
  message += "Order: Burger x2, Fries x1\n";
  message += "Delivery Address: 123 Main St\n";
  message += "Special Instructions: Extra ketchup please\n";

  return message;
}

module.exports = {
  generateMenuMessage,
};
