-- Add admin role to profiles role enum
-- First, we need to drop the existing check constraint and recreate it
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('user', 'business', 'admin'));

-- RLS Policy: Admins can read all business_requests
CREATE POLICY "Admins can read all business requests"
ON public.business_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- RLS Policy: Admins can update all business_requests
CREATE POLICY "Admins can update all business requests"
ON public.business_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- RLS Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- RLS Policy: Admins can update all profiles (for approving business requests)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Create index on profiles.role for faster admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Create index on business_requests.status for faster filtering
CREATE INDEX IF NOT EXISTS idx_business_requests_status ON public.business_requests(status);

-- NOTE: To set a user as admin, run this query in Supabase SQL Editor:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';
