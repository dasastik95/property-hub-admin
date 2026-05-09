-- Property Inquiries Table
-- Stores inquiries from potential buyers/renters about properties

CREATE TABLE IF NOT EXISTS public.property_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  message TEXT NOT NULL,
  inquiry_type TEXT NOT NULL DEFAULT 'general' CHECK (inquiry_type IN ('general', 'price', 'availability', 'visit', 'documents')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_inquiries_property_id ON public.property_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_user_id ON public.property_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_status ON public.property_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_created_at ON public.property_inquiries(created_at DESC);

-- Updated at trigger
DROP TRIGGER IF EXISTS property_inquiries_set_updated_at ON public.property_inquiries;
CREATE TRIGGER property_inquiries_set_updated_at
BEFORE UPDATE ON public.property_inquiries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can create inquiries
DROP POLICY IF EXISTS "Anyone can create inquiries" ON public.property_inquiries;
CREATE POLICY "Anyone can create inquiries"
ON public.property_inquiries FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Users can view their own inquiries
DROP POLICY IF EXISTS "Users can view own inquiries" ON public.property_inquiries;
CREATE POLICY "Users can view own inquiries"
ON public.property_inquiries FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Property owners can view inquiries about their properties
DROP POLICY IF EXISTS "Property owners can view inquiries" ON public.property_inquiries;
CREATE POLICY "Property owners can view inquiries"
ON public.property_inquiries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_inquiries.property_id
    AND p.owner_id = auth.uid()
  )
);

-- Admins can view all inquiries
DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.property_inquiries;
CREATE POLICY "Admins can view all inquiries"
ON public.property_inquiries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Users can update their own inquiries
DROP POLICY IF EXISTS "Users can update own inquiries" ON public.property_inquiries;
CREATE POLICY "Users can update own inquiries"
ON public.property_inquiries FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Property owners and admins can update inquiries
DROP POLICY IF EXISTS "Property owners and admins can update inquiries" ON public.property_inquiries;
CREATE POLICY "Property owners and admins can update inquiries"
ON public.property_inquiries FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_inquiries.property_id
    AND p.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);