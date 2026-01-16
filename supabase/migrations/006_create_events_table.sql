-- Create events table for analytics tracking
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  business_id UUID NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID NULL REFERENCES public.products(id) ON DELETE CASCADE,
  actor_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for common query patterns
CREATE INDEX idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX idx_events_business_id ON public.events(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX idx_events_event_type ON public.events(event_type);
CREATE INDEX idx_events_business_type ON public.events(business_id, event_type) WHERE business_id IS NOT NULL;

-- Add a comment to the table
COMMENT ON TABLE public.events IS 'Analytics events tracking user interactions with businesses and products';

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous and authenticated users to INSERT events
CREATE POLICY "Allow public to insert events"
  ON public.events
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow admins to SELECT all events
CREATE POLICY "Allow admins to view events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Prevent public from viewing events (redundant with no other SELECT policies, but explicit is good)
-- No additional policy needed - RLS defaults to deny unless explicitly allowed
