-- Custom quote requests start as pending_approval (admin must approve before payment)

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'pending',
  'pending_approval',
  'approved',
  'waiting_for_payment',
  'payment_submitted',
  'processing',
  'shipping',
  'delivered',
  'refunded',
  'rejected'
));

UPDATE public.orders
SET status = 'pending_approval'
WHERE order_type = 'custom'
  AND status = 'pending'
  AND total_amount = 0;
