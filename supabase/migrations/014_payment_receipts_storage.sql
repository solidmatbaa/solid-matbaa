-- Payment receipts storage bucket (public) + RLS policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  true,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read payment receipts" ON storage.objects;
CREATE POLICY "Public read payment receipts"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "Authenticated read payment receipts" ON storage.objects;
CREATE POLICY "Authenticated read payment receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "Authenticated insert payment receipts" ON storage.objects;
CREATE POLICY "Authenticated insert payment receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
