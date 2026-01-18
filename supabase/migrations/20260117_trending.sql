-- ============================================
-- RPC Functions for Public Trending Data
-- These return aggregated data only - no raw event access
-- ============================================

-- Function to get trending businesses (by views, tie-breaker: clicks)
CREATE OR REPLACE FUNCTION get_trending_businesses(p_days integer, p_limit integer)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  address text,
  views_count bigint,
  clicks_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.category,
    b.address,
    COALESCE(COUNT(*) FILTER (WHERE e.event_type = 'business_view'), 0) AS views_count,
    COALESCE(COUNT(*) FILTER (WHERE e.event_type = 'product_click'), 0) AS clicks_count
  FROM businesses b
  LEFT JOIN events e ON e.business_id = b.id
    AND e.created_at >= now() - (p_days || ' days')::interval
  GROUP BY b.id, b.name, b.category, b.address
  HAVING COUNT(*) FILTER (WHERE e.event_type = 'business_view') > 0
     OR COUNT(*) FILTER (WHERE e.event_type = 'product_click') > 0
  ORDER BY views_count DESC, clicks_count DESC
  LIMIT p_limit;
END;
$$;

-- Function to get trending products (by clicks)
CREATE OR REPLACE FUNCTION get_trending_products(p_days integer, p_limit integer)
RETURNS TABLE (
  id uuid,
  business_id uuid,
  name text,
  price numeric,
  image_url text,
  clicks_count bigint,
  business_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.business_id,
    p.name,
    p.price,
    p.image_url,
    COUNT(*) AS clicks_count,
    b.name AS business_name
  FROM events e
  JOIN products p ON p.id = e.product_id
  JOIN businesses b ON b.id = p.business_id
  WHERE e.event_type = 'product_click'
    AND e.created_at >= now() - (p_days || ' days')::interval
    AND e.product_id IS NOT NULL
  GROUP BY p.id, p.business_id, p.name, p.price, p.image_url, b.name
  ORDER BY clicks_count DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions to everyone (including anon for public access)
GRANT EXECUTE ON FUNCTION get_trending_businesses(integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION get_trending_businesses(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_products(integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION get_trending_products(integer, integer) TO authenticated;

-- ============================================
-- Performance Notes:
-- ============================================
-- The existing indexes from 20260116_analytics.sql support these queries:
-- - idx_events_created_at: for time filtering
-- - idx_events_type_created: for event_type + time filtering
-- - idx_events_business_created: for business aggregation
-- - idx_events_product_created: for product aggregation
--
-- For high-traffic scenarios, consider adding a materialized view
-- that refreshes periodically (e.g., every 5 minutes) to cache results.
-- ============================================
