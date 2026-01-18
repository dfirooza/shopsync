-- Create events table for analytics
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  business_id uuid NULL REFERENCES businesses(id) ON DELETE SET NULL,
  product_id uuid NULL REFERENCES products(id) ON DELETE SET NULL,
  actor_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_type_created ON events(event_type, created_at DESC);
CREATE INDEX idx_events_business_created ON events(business_id, created_at DESC);
CREATE INDEX idx_events_product_created ON events(product_id, created_at DESC);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to INSERT events
CREATE POLICY "Anyone can insert events"
  ON events FOR INSERT
  WITH CHECK (true);

-- No public SELECT on raw events (security requirement)
-- Analytics access is through RPC functions only

-- ============================================
-- RPC Functions for Analytics (SECURITY DEFINER)
-- These enforce that owners can only see their own business data
-- ============================================

-- Function to get KPIs for a business
CREATE OR REPLACE FUNCTION get_business_kpis(p_business_id uuid, p_days integer)
RETURNS TABLE (
  views_count bigint,
  clicks_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Verify the caller owns this business
  SELECT owner_id INTO v_owner_id
  FROM businesses
  WHERE id = p_business_id;

  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this business';
  END IF;

  -- Return aggregated KPIs
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'business_view') AS views_count,
    COUNT(*) FILTER (WHERE event_type = 'product_click') AS clicks_count
  FROM events
  WHERE business_id = p_business_id
    AND created_at >= now() - (p_days || ' days')::interval;
END;
$$;

-- Function to get top products by clicks
CREATE OR REPLACE FUNCTION get_top_products(p_business_id uuid, p_days integer, p_limit integer)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  click_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Verify the caller owns this business
  SELECT owner_id INTO v_owner_id
  FROM businesses
  WHERE id = p_business_id;

  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this business';
  END IF;

  -- Return top products
  RETURN QUERY
  SELECT
    e.product_id,
    p.name AS product_name,
    COUNT(*) AS click_count
  FROM events e
  JOIN products p ON p.id = e.product_id
  WHERE e.business_id = p_business_id
    AND e.event_type = 'product_click'
    AND e.created_at >= now() - (p_days || ' days')::interval
    AND e.product_id IS NOT NULL
  GROUP BY e.product_id, p.name
  ORDER BY click_count DESC
  LIMIT p_limit;
END;
$$;

-- Function to get top search terms that led to views/clicks for this business
CREATE OR REPLACE FUNCTION get_top_search_terms(p_business_id uuid, p_days integer, p_limit integer)
RETURNS TABLE (
  search_term text,
  occurrence_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  -- Verify the caller owns this business
  SELECT owner_id INTO v_owner_id
  FROM businesses
  WHERE id = p_business_id;

  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You do not own this business';
  END IF;

  -- Return top search terms where this business appeared in results
  RETURN QUERY
  SELECT
    e.metadata->>'query' AS search_term,
    COUNT(*) AS occurrence_count
  FROM events e
  WHERE e.event_type = 'search'
    AND e.created_at >= now() - (p_days || ' days')::interval
    AND e.metadata->>'query' IS NOT NULL
    AND e.metadata->>'query' != ''
    AND (
      -- Business ID is in the results_business_ids array
      e.metadata->'results_business_ids' @> to_jsonb(p_business_id::text)
    )
  GROUP BY e.metadata->>'query'
  ORDER BY occurrence_count DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_business_kpis(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_products(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_search_terms(uuid, integer, integer) TO authenticated;

-- Also allow anon to insert (for non-logged-in users viewing pages)
GRANT INSERT ON events TO anon;
GRANT INSERT ON events TO authenticated;
