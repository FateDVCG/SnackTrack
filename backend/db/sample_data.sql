-- Clear existing menu items
TRUNCATE menu_items RESTART IDENTITY CASCADE;

-- Insert sample menu items
INSERT INTO menu_items (name, name_tagalog, price, category, aliases) VALUES
  ('Burger', 'Hamburger', 120.99, 'Main Dishes', '["burger", "hamburger", "beefburger"]'),
  ('Fried Chicken', 'Pritong Manok', 150.99, 'Main Dishes', '["chicken", "manok", "pritong manok"]'),
  ('French Fries', 'Pritong Patatas', 40.99, 'Sides', '["fries", "patatas", "chips"]'),
  ('Rice', 'Kanin', 20.99, 'Sides', '["rice", "kanin", "bigas"]'),
  ('Soft Drink', 'Softdrinks', 35.99, 'Beverages', '["coke", "pepsi", "soda", "softdrinks"]'),
  ('Spaghetti', 'Espageti', 89.99, 'Main Dishes', '["pasta", "noodles", "espageti"]'),
  ('Chicken Wings', 'Pakpak ng Manok', 129.99, 'Main Dishes', '["wings", "hot wings", "pakpak"]'),
  ('Ice Cream', 'Sorbetes', 45.99, 'Desserts', '["ice cream", "sorbetes", "dessert"]'); 