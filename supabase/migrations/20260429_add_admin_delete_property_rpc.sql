-- ============================================================================
-- ADMIN PROPERTY DELETE RPC
-- Deletes a property via SECURITY DEFINER so admin removal still works even
-- when direct client-side DELETE statements are blocked by RLS.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_delete_property_rpc(p_property_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_images TEXT[];
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can delete properties';
  END IF;

  SELECT images
  INTO v_images
  FROM public.properties
  WHERE id = p_property_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property % not found', p_property_id;
  END IF;

  DELETE FROM public.properties
  WHERE id = p_property_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property % could not be deleted', p_property_id;
  END IF;

  RETURN COALESCE(v_images, ARRAY[]::TEXT[]);
END;
$$;
