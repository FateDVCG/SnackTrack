-- Add order_type column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT 'Delivery';

-- Update existing orders to have a random order type
UPDATE orders 
SET order_type = CASE 
  WHEN random() < 0.33 THEN 'Dine In'
  WHEN random() < 0.66 THEN 'Take Out'
  ELSE 'Delivery'
END
WHERE order_type IS NULL; 