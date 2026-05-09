-- ============================================================================
-- ADMIN PROPERTY WRITE RPCS
-- Use SECURITY DEFINER functions for admin listing review actions so approve,
-- publish, and save operations keep working even when RLS blocks direct writes.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_property_full_details_rpc(p_property_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  property_type public.property_type,
  listing_type public.listing_type,
  category TEXT,
  price NUMERIC,
  city TEXT,
  locality TEXT,
  address TEXT,
  pincode TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_sqft INTEGER,
  furnishing TEXT,
  floor_number INTEGER,
  total_floors INTEGER,
  amenities TEXT[],
  images TEXT[],
  is_verified BOOLEAN,
  is_featured BOOLEAN,
  contact_phone TEXT,
  contact_whatsapp TEXT,
  owner_id UUID,
  views INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  status public.property_status,
  owner_type public.owner_type
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  RETURN QUERY
  SELECT
    pr.id,
    pr.title,
    pr.description,
    pr.property_type,
    pr.listing_type,
    pr.category,
    pr.price,
    pr.city,
    pr.locality,
    pr.address,
    pr.pincode,
    pr.latitude,
    pr.longitude,
    pr.bedrooms,
    pr.bathrooms,
    pr.area_sqft,
    pr.furnishing,
    pr.floor_number,
    pr.total_floors,
    pr.amenities,
    pr.images,
    pr.is_verified,
    pr.is_featured,
    pr.contact_phone,
    pr.contact_whatsapp,
    pr.owner_id,
    pr.views,
    pr.created_at,
    pr.updated_at,
    pr.status,
    pr.owner_type
  FROM public.properties pr
  WHERE pr.id = p_property_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_property_rpc(
  p_property_id UUID,
  p_updates JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updates public.properties%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update properties';
  END IF;

  v_updates := jsonb_populate_record(NULL::public.properties, COALESCE(p_updates, '{}'::jsonb));

  UPDATE public.properties
  SET
    owner_type = CASE WHEN p_updates ? 'owner_type' THEN v_updates.owner_type ELSE owner_type END,
    property_type = CASE
      WHEN p_updates ? 'property_type' THEN v_updates.property_type
      ELSE property_type
    END,
    listing_type = CASE
      WHEN p_updates ? 'listing_type' THEN v_updates.listing_type
      ELSE listing_type
    END,
    title = CASE WHEN p_updates ? 'title' THEN v_updates.title ELSE title END,
    description = CASE WHEN p_updates ? 'description' THEN v_updates.description ELSE description END,
    category = CASE WHEN p_updates ? 'category' THEN v_updates.category ELSE category END,
    price = CASE WHEN p_updates ? 'price' THEN v_updates.price ELSE price END,
    city = CASE WHEN p_updates ? 'city' THEN v_updates.city ELSE city END,
    locality = CASE WHEN p_updates ? 'locality' THEN v_updates.locality ELSE locality END,
    address = CASE WHEN p_updates ? 'address' THEN v_updates.address ELSE address END,
    pincode = CASE WHEN p_updates ? 'pincode' THEN v_updates.pincode ELSE pincode END,
    latitude = CASE WHEN p_updates ? 'latitude' THEN v_updates.latitude ELSE latitude END,
    longitude = CASE WHEN p_updates ? 'longitude' THEN v_updates.longitude ELSE longitude END,
    bedrooms = CASE WHEN p_updates ? 'bedrooms' THEN v_updates.bedrooms ELSE bedrooms END,
    bathrooms = CASE WHEN p_updates ? 'bathrooms' THEN v_updates.bathrooms ELSE bathrooms END,
    area_sqft = CASE WHEN p_updates ? 'area_sqft' THEN v_updates.area_sqft ELSE area_sqft END,
    furnishing = CASE WHEN p_updates ? 'furnishing' THEN v_updates.furnishing ELSE furnishing END,
    floor_number = CASE
      WHEN p_updates ? 'floor_number' THEN v_updates.floor_number
      ELSE floor_number
    END,
    total_floors = CASE
      WHEN p_updates ? 'total_floors' THEN v_updates.total_floors
      ELSE total_floors
    END,
    amenities = CASE WHEN p_updates ? 'amenities' THEN v_updates.amenities ELSE amenities END,
    images = CASE WHEN p_updates ? 'images' THEN v_updates.images ELSE images END,
    contact_phone = CASE
      WHEN p_updates ? 'contact_phone' THEN v_updates.contact_phone
      ELSE contact_phone
    END,
    contact_whatsapp = CASE
      WHEN p_updates ? 'contact_whatsapp' THEN v_updates.contact_whatsapp
      ELSE contact_whatsapp
    END,
    status = CASE WHEN p_updates ? 'status' THEN v_updates.status ELSE status END,
    is_verified = CASE
      WHEN p_updates ? 'is_verified' THEN v_updates.is_verified
      ELSE is_verified
    END,
    is_featured = CASE
      WHEN p_updates ? 'is_featured' THEN v_updates.is_featured
      ELSE is_featured
    END
  WHERE id = p_property_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property % not found', p_property_id;
  END IF;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_property_rpc(p_property_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve properties';
  END IF;

  UPDATE public.properties
  SET
    status = 'active',
    is_verified = true
  WHERE id = p_property_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property % not found', p_property_id;
  END IF;

  RETURN TRUE;
END;
$$;
