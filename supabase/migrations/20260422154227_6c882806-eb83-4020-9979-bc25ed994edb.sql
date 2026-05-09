-- Drop old unrelated tables
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.contact_submissions CASCADE;

-- Enums
CREATE TYPE public.user_role AS ENUM ('buyer', 'seller', 'broker', 'admin');
CREATE TYPE public.property_type AS ENUM ('residential', 'commercial');
CREATE TYPE public.listing_type AS ENUM ('sale', 'rent');
CREATE TYPE public.property_status AS ENUM ('pending', 'active', 'sold', 'rented', 'inactive');
CREATE TYPE public.owner_type AS ENUM ('individual', 'broker');

-- =====================================================
-- PROFILES
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'buyer',
  owner_type public.owner_type,
  bio TEXT,
  city TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PROPERTIES
-- =====================================================
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  property_type public.property_type NOT NULL,
  listing_type public.listing_type NOT NULL,
  category TEXT, -- e.g. apartment, house, plot, office, shop, warehouse
  price NUMERIC(14,2) NOT NULL,
  -- Location
  address TEXT,
  locality TEXT,
  city TEXT NOT NULL DEFAULT 'Purulia',
  state TEXT NOT NULL DEFAULT 'West Bengal',
  pincode TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  -- Residential
  bedrooms INTEGER,
  bathrooms INTEGER,
  furnishing TEXT, -- furnished, semi-furnished, unfurnished
  floor_number INTEGER,
  total_floors INTEGER,
  -- Common
  area_sqft INTEGER,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  -- Media
  images TEXT[] NOT NULL DEFAULT '{}',
  -- Contact
  owner_type public.owner_type NOT NULL DEFAULT 'individual',
  contact_phone TEXT,
  contact_whatsapp TEXT,
  -- Meta
  status public.property_status NOT NULL DEFAULT 'active',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_properties_owner ON public.properties(owner_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_properties_type_listing ON public.properties(property_type, listing_type);
CREATE INDEX idx_properties_created_at ON public.properties(created_at DESC);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Anyone can view active listings
CREATE POLICY "Active properties are viewable by everyone"
  ON public.properties FOR SELECT
  USING (status = 'active');

-- Owners can view all of their own properties (any status)
CREATE POLICY "Owners can view their own properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Authenticated users can create properties (must own them)
CREATE POLICY "Authenticated users can create properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own properties
CREATE POLICY "Owners can update their own properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Owners can delete their own properties
CREATE POLICY "Owners can delete their own properties"
  ON public.properties FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- =====================================================
-- SAVED PROPERTIES (wishlist)
-- =====================================================
CREATE TABLE public.saved_properties (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);

ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved properties"
  ON public.saved_properties FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save properties"
  ON public.saved_properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their own properties"
  ON public.saved_properties FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- updated_at triggers
-- =====================================================
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STORAGE: property-images bucket (public read)
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Property images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images to their folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own property images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own property images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );