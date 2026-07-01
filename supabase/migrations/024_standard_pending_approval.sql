-- Pre-made design orders enter the same approval queue as custom quotes

UPDATE public.orders
SET status = 'pending_approval'
WHERE order_type = 'standard'
  AND status = 'pending';
