-- ============================================================================
-- PROPERTY APPROVAL WORKFLOW
-- New listings stay pending until an admin approves them.
-- Public users can only see listings that are both active and verified.
-- Admins can inspect, edit, and delete any property directly.
-- ============================================================================

ALTER TABLE public.properties
ALTER COLUMN status SET DEFAULT 'pending';

DROP POLICY IF EXISTS "Active properties are viewable by everyone" ON public.properties;

CREATE POLICY "Approved properties are viewable by everyone"
  ON public.properties FOR SELECT
  USING (status = 'active' AND is_verified = true);

CREATE POLICY "Admins can view all properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all properties"
  ON public.properties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
