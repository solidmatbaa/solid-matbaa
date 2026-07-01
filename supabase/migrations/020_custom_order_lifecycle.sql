-- Custom printing lifecycle: pending_approval → pending_payment → paid → processing

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
  'delivered',
  'refunded',
  'rejected'
));

UPDATE public.orders
SET status = 'pending_approval'
WHERE order_type = 'custom'
  AND status = 'pending'
  AND total_amount = 0;

UPDATE public.orders
SET status = 'pending_payment'
WHERE order_type = 'custom'
  AND status = 'waiting_for_payment';

UPDATE public.orders
SET status = 'paid'
WHERE order_type = 'custom'
  AND status = 'payment_submitted';
