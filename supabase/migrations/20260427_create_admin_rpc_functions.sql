-- ============================================================================
-- ADMIN RPC FUNCTIONS - Secure admin queries with SECURITY DEFINER
-- These functions bypass RLS while checking if user is admin
-- ============================================================================

-- Function 1: Get all admin users
CREATE OR REPLACE FUNCTION get_admin_users_rpc(
  p_search TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID, email TEXT, display_name TEXT, role public.user_role, 
  phone TEXT, avatar_url TEXT, city TEXT, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  RETURN QUERY
  SELECT p.id, p.email, p.display_name, p.role, p.phone, p.avatar_url, p.city, p.created_at
  FROM profiles p
  WHERE (p_search IS NULL OR p.display_name ILIKE '%' || p_search || '%' OR p.email ILIKE '%' || p_search || '%')
    AND (p_role IS NULL OR p.role = p_role::user_role)
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Function 2: Get all admin properties
CREATE OR REPLACE FUNCTION get_admin_properties_rpc(
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_property_type TEXT DEFAULT NULL,
  p_listing_type TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID, title TEXT, price NUMERIC, city TEXT, property_type public.property_type,
  listing_type public.listing_type, status public.property_status, is_verified BOOLEAN,
  is_featured BOOLEAN, created_at TIMESTAMPTZ, owner_id UUID,
  owner_display_name TEXT, owner_email TEXT, owner_phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  RETURN QUERY
  SELECT 
    pr.id, pr.title, pr.price, pr.city, pr.property_type, pr.listing_type,
    pr.status, pr.is_verified, pr.is_featured, pr.created_at, pr.owner_id,
    p.display_name, p.email, p.phone
  FROM properties pr
  LEFT JOIN profiles p ON pr.owner_id = p.id
  WHERE (p_search IS NULL OR pr.title ILIKE '%' || p_search || '%' OR pr.address ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR pr.status = p_status::property_status)
    AND (p_property_type IS NULL OR pr.property_type = p_property_type::property_type)
    AND (p_listing_type IS NULL OR pr.listing_type = p_listing_type::listing_type)
  ORDER BY pr.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Function 3: Get property details (admin)
CREATE OR REPLACE FUNCTION get_admin_property_details_rpc(p_property_id UUID)
RETURNS TABLE (
  id UUID, title TEXT, description TEXT, price NUMERIC, city TEXT,
  locality TEXT, address TEXT, status public.property_status, is_verified BOOLEAN,
  is_featured BOOLEAN, images TEXT[], owner_id UUID, owner_display_name TEXT,
  owner_email TEXT, owner_phone TEXT, property_type public.property_type,
  listing_type public.listing_type, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  RETURN QUERY
  SELECT 
    pr.id, pr.title, pr.description, pr.price, pr.city, pr.locality, pr.address,
    pr.status, pr.is_verified, pr.is_featured, pr.images, pr.owner_id,
    p.display_name, p.email, p.phone, pr.property_type, pr.listing_type, pr.created_at
  FROM properties pr
  LEFT JOIN profiles p ON pr.owner_id = p.id
  WHERE pr.id = p_property_id;
END;
$$;

-- Function 4: Get user details (admin)
CREATE OR REPLACE FUNCTION get_admin_user_details_rpc(p_user_id UUID)
RETURNS TABLE (
  id UUID, email TEXT, display_name TEXT, role public.user_role,
  phone TEXT, whatsapp TEXT, avatar_url TEXT, city TEXT, bio TEXT,
  owner_type public.owner_type, onboarded BOOLEAN, preferences JSONB, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  RETURN QUERY
  SELECT p.id, p.email, p.display_name, p.role, p.phone, p.whatsapp,
         p.avatar_url, p.city, p.bio, p.owner_type, p.onboarded, p.preferences, p.created_at
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$;

-- Function 5: Update user role (admin)
CREATE OR REPLACE FUNCTION update_user_role_rpc(p_user_id UUID, p_new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can update roles';
  END IF;

  UPDATE profiles
  SET role = p_new_role::user_role
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Function 6: Update property status (admin)
CREATE OR REPLACE FUNCTION update_property_status_rpc(p_property_id UUID, p_new_status TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can update property status';
  END IF;

  UPDATE properties
  SET status = p_new_status::property_status
  WHERE id = p_property_id;

  RETURN TRUE;
END;
$$;

-- Function 7: Verify property (admin)
CREATE OR REPLACE FUNCTION verify_property_rpc(p_property_id UUID, p_verified BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can verify properties';
  END IF;

  UPDATE properties
  SET is_verified = p_verified
  WHERE id = p_property_id;

  RETURN TRUE;
END;
$$;

-- Function 8: Feature property (admin)
CREATE OR REPLACE FUNCTION feature_property_rpc(p_property_id UUID, p_featured BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can feature properties';
  END IF;

  UPDATE properties
  SET is_featured = p_featured
  WHERE id = p_property_id;

  RETURN TRUE;
END;
$$;

-- Function 9: Delete property photo (admin)
CREATE OR REPLACE FUNCTION delete_property_photo_rpc(p_property_id UUID, p_photo_url TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete photos';
  END IF;

  UPDATE properties
  SET images = array_remove(images, p_photo_url)
  WHERE id = p_property_id;

  RETURN TRUE;
END;
$$;

-- Function 10: Get dashboard stats (admin)
CREATE OR REPLACE FUNCTION get_dashboard_stats_rpc()
RETURNS TABLE (
  total_users BIGINT, total_properties BIGINT, active_listings BIGINT,
  pending_approvals BIGINT, sold_rented BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Only admins can access dashboard stats';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM properties) as total_properties,
    (SELECT COUNT(*) FROM properties WHERE status = 'active') as active_listings,
    (SELECT COUNT(*) FROM properties WHERE status = 'pending') as pending_approvals,
    (SELECT COUNT(*) FROM properties WHERE status IN ('sold', 'rented')) as sold_rented;
END;
$$;
