-- Custom order design files: dedicated URL column + Supabase Storage bucket

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS design_file_url TEXT;

UPDATE public.orders
SET design_file_url = file_url
WHERE design_file_url IS NULL
  AND file_url IS NOT NULL
  AND order_type = 'custom';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-designs',
  'order-designs',
  true,
  10485760,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read order designs" ON storage.objects;
CREATE POLICY "Public read order designs"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'order-designs');
