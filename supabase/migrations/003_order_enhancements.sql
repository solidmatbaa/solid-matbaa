-- Order enhancements: pricing tiers, receipts, shipping, user address, rejected status

ALTER TABLE products ADD COLUMN IF NOT EXISTS pricing_tiers JSONB DEFAULT '[
  {"quantity": 100, "price": 19},
  {"quantity": 500, "price": 39},
  {"quantity": 1000, "price": 69}
]';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address JSONB DEFAULT NULL;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_info JSONB DEFAULT NULL;

-- Allow rejected status for admin rejection flow
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'pending', 'confirmed', 'processing', 'shipped',
  'delivered', 'returned', 'refund_processed', 'cancelled', 'rejected'
));

-- Update seed products with default pricing tiers
UPDATE products SET pricing_tiers = '[
  {"quantity": 100, "price": 19},
  {"quantity": 500, "price": 39},
  {"quantity": 1000, "price": 69}
]'::jsonb WHERE pricing_tiers IS NULL OR pricing_tiers = '[]'::jsonb;
