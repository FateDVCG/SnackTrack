const db = require("../config/db");

/**
 * Get all menu items
 */
async function getAllMenuItems() {
  const query = "SELECT * FROM menu_items ORDER BY category, name";
  const { rows } = await db.query(query);
  return rows;
}

/**
 * Find menu items by name (supports both English and Tagalog)
 */
async function findMenuItemsByName(searchTerm) {
  const query = `
    SELECT * FROM menu_items 
    WHERE 
      LOWER(name) LIKE LOWER($1) 
      OR LOWER(name_tagalog) LIKE LOWER($1)
      OR EXISTS (
        SELECT 1 
        FROM jsonb_array_elements_text(aliases) alias 
        WHERE LOWER(alias::text) LIKE LOWER($1)
      )
    ORDER BY 
      CASE 
        WHEN LOWER(name) = LOWER($2) THEN 1
        WHEN LOWER(name_tagalog) = LOWER($2) THEN 1
        WHEN LOWER(name) LIKE LOWER($2) || '%' THEN 2
        WHEN LOWER(name_tagalog) LIKE LOWER($2) || '%' THEN 2
        ELSE 3
      END,
      name
  `;

  const { rows } = await db.query(query, [`%${searchTerm}%`, searchTerm]);
  return rows;
}

/**
 * Get menu item by ID
 */
async function getMenuItemById(id) {
  const query = "SELECT * FROM menu_items WHERE id = $1";
  const { rows } = await db.query(query, [id]);
  return rows[0];
}

/**
 * Create a new menu item
 */
async function createMenuItem(itemData) {
  const { name, name_tagalog, price, category, aliases = [] } = itemData;

  const query = `
    INSERT INTO menu_items (
      name,
      name_tagalog,
      price,
      category,
      aliases
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [name, name_tagalog, price, category, JSON.stringify(aliases)];

  const { rows } = await db.query(query, values);
  return rows[0];
}

/**
 * Update menu item
 */
async function updateMenuItem(id, itemData) {
  const { name, name_tagalog, price, category, aliases = [] } = itemData;

  const query = `
    UPDATE menu_items
    SET 
      name = $1,
      name_tagalog = $2,
      price = $3,
      category = $4,
      aliases = $5,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
    RETURNING *
  `;

  const values = [
    name,
    name_tagalog,
    price,
    category,
    JSON.stringify(aliases),
    id,
  ];

  const { rows } = await db.query(query, values);
  return rows[0];
}

/**
 * Delete menu item
 */
async function deleteMenuItem(id) {
  const query = "DELETE FROM menu_items WHERE id = $1 RETURNING *";
  const { rows } = await db.query(query, [id]);
  return rows[0];
}

module.exports = {
  getAllMenuItems,
  findMenuItemsByName,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
