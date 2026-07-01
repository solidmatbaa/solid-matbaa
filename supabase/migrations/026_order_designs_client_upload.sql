-- Allow authenticated users to upload their own custom design PDFs directly from the client
CREATE POLICY "Owner insert order designs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'order-designs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
