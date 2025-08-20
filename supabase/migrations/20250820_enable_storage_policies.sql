-- Storage RLS policies for image buckets (fix 403 Unauthorized on upload)

-- Ensure storage schema exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Enable RLS on storage.objects (should be enabled by default)
ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;

-- READ (public) policies for image buckets
DROP POLICY IF EXISTS "Public read casino-images" ON storage.objects;
CREATE POLICY "Public read casino-images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'casino-images');

DROP POLICY IF EXISTS "Public read news-images" ON storage.objects;
CREATE POLICY "Public read news-images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'news-images');

DROP POLICY IF EXISTS "Public read bonus-images" ON storage.objects;
CREATE POLICY "Public read bonus-images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'bonus-images');

-- INSERT (authenticated) policies for uploads
DROP POLICY IF EXISTS "Authenticated upload casino-images" ON storage.objects;
CREATE POLICY "Authenticated upload casino-images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'casino-images');

DROP POLICY IF EXISTS "Authenticated upload news-images" ON storage.objects;
CREATE POLICY "Authenticated upload news-images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'news-images');

DROP POLICY IF EXISTS "Authenticated upload bonus-images" ON storage.objects;
CREATE POLICY "Authenticated upload bonus-images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'bonus-images');

-- Optional: allow updates/deletes by authenticated users within the bucket
DROP POLICY IF EXISTS "Authenticated update casino-images" ON storage.objects;
CREATE POLICY "Authenticated update casino-images" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'casino-images')
  WITH CHECK (bucket_id = 'casino-images');

DROP POLICY IF EXISTS "Authenticated delete casino-images" ON storage.objects;
CREATE POLICY "Authenticated delete casino-images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'casino-images');

-- Repeat optional update/delete for other buckets as needed
DROP POLICY IF EXISTS "Authenticated update news-images" ON storage.objects;
CREATE POLICY "Authenticated update news-images" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'news-images')
  WITH CHECK (bucket_id = 'news-images');

DROP POLICY IF EXISTS "Authenticated delete news-images" ON storage.objects;
CREATE POLICY "Authenticated delete news-images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'news-images');

DROP POLICY IF EXISTS "Authenticated update bonus-images" ON storage.objects;
CREATE POLICY "Authenticated update bonus-images" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'bonus-images')
  WITH CHECK (bucket_id = 'bonus-images');

DROP POLICY IF EXISTS "Authenticated delete bonus-images" ON storage.objects;
CREATE POLICY "Authenticated delete bonus-images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'bonus-images');


