-- Customer bank account holder name submitted with payment proof
ALTER TABLE orders ADD COLUMN IF NOT EXISTS account_holder_name TEXT;
