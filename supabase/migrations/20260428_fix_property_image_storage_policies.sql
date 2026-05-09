-- ============================================================================
-- PROPERTY IMAGE STORAGE POLICIES
-- Allow authenticated uploads to the property-images bucket and let the file
-- owner or any admin update/delete those objects through the Storage API.
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can upload property images to their folder"
  ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Owners and admins can update property images" ON storage.objects;
DROP POLICY IF EXISTS "Owners and admins can delete property images" ON storage.objects;

CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Owners and admins can update property images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (
      owner_id::text = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
      )
    )
  )
  WITH CHECK (
    bucket_id = 'property-images'
    AND (
      owner_id::text = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
      )
    )
  );

CREATE POLICY "Owners and admins can delete property images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (
      owner_id::text = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
      )
    )
  );
