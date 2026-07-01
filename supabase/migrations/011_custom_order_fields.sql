-- Custom order workflow: admin notes on orders

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;
