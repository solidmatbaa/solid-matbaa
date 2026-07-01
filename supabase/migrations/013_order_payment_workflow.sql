-- Custom order payment workflow + product image on order items

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'pending',
  'approved',
  'waiting_for_payment',
  'payment_submitted',
  'processing',
  'shipping',
  'delivered',
  'refunded',
  'rejected'
));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-receipts',
  'order-receipts',
  true,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read order receipts" ON storage.objects;
CREATE POLICY "Public read order receipts"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'order-receipts');
