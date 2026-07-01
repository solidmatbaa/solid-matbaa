-- Allow cancelled status for admin reject flow

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'pending',
  'pending_approval',
  'pending_payment',
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
