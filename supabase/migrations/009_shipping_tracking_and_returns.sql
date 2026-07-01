-- Dedicated shipping tracking columns + active return uniqueness

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipping_carrier TEXT,
  ADD COLUMN IF NOT EXISTS shipping_url TEXT;

UPDATE public.orders
SET
  tracking_number = COALESCE(tracking_number, shipping_info->>'tracking_number'),
  shipping_carrier = COALESCE(shipping_carrier, shipping_info->>'shipping_company'),
  shipping_url = COALESCE(shipping_url, shipping_info->>'tracking_url')
WHERE shipping_info IS NOT NULL;

-- One active return/refund request per order
CREATE UNIQUE INDEX IF NOT EXISTS idx_returns_one_active_per_order
  ON public.returns (order_id)
  WHERE is_archived = false AND status NOT IN ('rejected', 'refunded');
