-- Private storage buckets: owner + admin read only (no public receipt/design exposure)

UPDATE storage.buckets
SET public = false
WHERE id IN ('payment-receipts', 'order-designs', 'order-receipts');

-- payment-receipts
DROP POLICY IF EXISTS "Public read payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated insert payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Owner or admin read payment receipts" ON storage.objects;

CREATE POLICY "Owner or admin read payment receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR public.auth_user_is_admin()
    )
  );

CREATE POLICY "Owner insert payment receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- order-designs
DROP POLICY IF EXISTS "Public read order designs" ON storage.objects;
DROP POLICY IF EXISTS "Owner or admin read order designs" ON storage.objects;

CREATE POLICY "Owner or admin read order designs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'order-designs'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR public.auth_user_is_admin()
    )
  );

-- legacy order-receipts bucket (if present)
DROP POLICY IF EXISTS "Public read order receipts" ON storage.objects;
DROP POLICY IF EXISTS "Owner or admin read order receipts" ON storage.objects;

CREATE POLICY "Owner or admin read order receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'order-receipts'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR public.auth_user_is_admin()
    )
  );
