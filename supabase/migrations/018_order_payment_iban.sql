-- Admin-defined payment details per order (not customer-provided)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_iban TEXT;

COMMENT ON COLUMN orders.account_holder_name IS 'Set by admin during payment verification';
COMMENT ON COLUMN orders.payment_iban IS 'IBAN for this order, set by admin during payment verification';
