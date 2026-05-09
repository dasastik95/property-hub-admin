-- Replace overly permissive public listing with object-fetch only access.
-- Storage uses storage.objects rows for both LIST and GET; restricting via
-- a per-object policy still allows public GET of known URLs while preventing
-- bulk enumeration of the bucket via LIST.
DROP POLICY IF EXISTS "Property images are publicly accessible" ON storage.objects;

CREATE POLICY "Property images are publicly readable by URL"
  ON storage.objects FOR SELECT
  TO public
  USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] IS NOT NULL
  );