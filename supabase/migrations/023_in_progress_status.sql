-- Admin workflow: approved orders use in_progress between payment and delivery

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'pending',
  'pending_approval',
  'pending_payment',
  'in_progress',
  'paid',
  'approved',
  'waiting_for_payment',
  'payment_submitted',
  'processing',
  'shipping',
  'shipped',
  'delivered',
  'refunded',
  'rejected',
  'cancelled',
  'confirmed',
  'returned',
  'refund_processed'
));

UPDATE public.orders
SET status = 'in_progress'
WHERE status IN ('paid', 'payment_submitted', 'processing', 'shipping', 'shipped', 'approved');
