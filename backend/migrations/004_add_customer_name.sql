-- Add customer name fields to orders table
ALTER TABLE orders
ADD COLUMN customer_name VARCHAR(255),
ADD COLUMN customer_phone VARCHAR(20);

-- Update existing orders to have default values
UPDATE orders
SET customer_name = 'Anonymous Customer',
    customer_phone = COALESCE(customer_id, 'Unknown')
WHERE customer_name IS NULL; 