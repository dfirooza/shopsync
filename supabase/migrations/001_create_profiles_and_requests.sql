-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'business')),
  business_approved BOOLEAN NOT NULL DEFAULT false,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create business_requests table
CREATE TABLE IF NOT EXISTS public.business_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_category TEXT NOT NULL,
  business_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add owner_id column to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles table
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (for manual creation if needed)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- RLS policies for business_requests table
-- Users can read their own requests
CREATE POLICY "Users can read own requests"
  ON public.business_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "Users can insert own requests"
  ON public.business_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update RLS policies for businesses table
-- Drop existing policies
DROP POLICY IF EXISTS "Public read access" ON public.businesses;

-- Public can read all businesses
CREATE POLICY "Public can read businesses"
  ON public.businesses
  FOR SELECT
  USING (true);

-- Only approved business users can insert businesses
CREATE POLICY "Approved business users can insert"
  ON public.businesses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'business'
      AND business_approved = true
    )
  );

-- Only approved business users can update their own businesses
CREATE POLICY "Approved business users can update own"
  ON public.businesses
  FOR UPDATE
  USING (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'business'
      AND business_approved = true
    )
  );

-- Only approved business users can delete their own businesses
CREATE POLICY "Approved business users can delete own"
  ON public.businesses
  FOR DELETE
  USING (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'business'
      AND business_approved = true
    )
  );

-- Update RLS policies for products table
-- Drop existing policies
DROP POLICY IF EXISTS "Public read access" ON public.products;

-- Public can read all products
CREATE POLICY "Public can read products"
  ON public.products
  FOR SELECT
  USING (true);

-- Only approved business users can insert products for their businesses
CREATE POLICY "Approved business users can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE b.id = business_id
      AND b.owner_id = auth.uid()
      AND p.role = 'business'
      AND p.business_approved = true
    )
  );

-- Only approved business users can update products for their businesses
CREATE POLICY "Approved business users can update products"
  ON public.products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE b.id = business_id
      AND b.owner_id = auth.uid()
      AND p.role = 'business'
      AND p.business_approved = true
    )
  );

-- Only approved business users can delete products for their businesses
CREATE POLICY "Approved business users can delete products"
  ON public.products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE b.id = business_id
      AND b.owner_id = auth.uid()
      AND p.role = 'business'
      AND p.business_approved = true
    )
  );
