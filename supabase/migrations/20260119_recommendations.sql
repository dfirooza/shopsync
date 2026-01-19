-- ============================================
-- Recommendations Feature Migration
-- ============================================

-- Add index for user-scoped event queries (for recommendations)
CREATE INDEX IF NOT EXISTS idx_events_actor_created ON events(actor_id, created_at DESC);

-- Add a query column to events for storing search terms directly
-- (currently search queries are in metadata->>'query', but having a dedicated column is faster)
ALTER TABLE events ADD COLUMN IF NOT EXISTS query text NULL;

-- Create index for query-based lookups
CREATE INDEX IF NOT EXISTS idx_events_query ON events(query) WHERE query IS NOT NULL;

-- ============================================
-- RLS Policy for users to read their own events
-- ============================================
CREATE POLICY "Users can read own events"
  ON events FOR SELECT
  USING (actor_id = auth.uid());

-- ============================================
-- RPC Function: get_recommendations_for_user
-- Returns personalized recommendations based on user behavior
-- ============================================
CREATE OR REPLACE FUNCTION get_recommendations_for_user(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_top_categories text[];
  v_viewed_business_ids uuid[];
  v_recent_searches text[];
  v_result jsonb;
BEGIN
  -- If no user provided or user has no events, return trending fallback
  IF p_user_id IS NULL THEN
    RETURN get_trending_fallback();
  END IF;

  -- Get businesses the user has already viewed (to exclude from recommendations)
  SELECT ARRAY_AGG(DISTINCT e.business_id)
  INTO v_viewed_business_ids
  FROM events e
  WHERE e.actor_id = p_user_id
    AND e.business_id IS NOT NULL
    AND e.created_at >= now() - interval '14 days';

  -- If no events found, return trending fallback
  IF v_viewed_business_ids IS NULL OR array_length(v_viewed_business_ids, 1) IS NULL THEN
    RETURN get_trending_fallback();
  END IF;

  -- Determine top categories from user's viewed businesses and clicked products
  SELECT ARRAY_AGG(DISTINCT category ORDER BY category)
  INTO v_top_categories
  FROM (
    -- Categories from viewed businesses
    SELECT b.category, COUNT(*) as weight
    FROM events e
    JOIN businesses b ON b.id = e.business_id
    WHERE e.actor_id = p_user_id
      AND e.event_type IN ('business_view', 'product_click')
      AND e.created_at >= now() - interval '14 days'
    GROUP BY b.category
    ORDER BY weight DESC
    LIMIT 5
  ) top_cats;

  -- Get recent search queries
  SELECT ARRAY_AGG(DISTINCT search_query ORDER BY search_query)
  INTO v_recent_searches
  FROM (
    SELECT COALESCE(e.query, e.metadata->>'query') as search_query
    FROM events e
    WHERE e.actor_id = p_user_id
      AND e.event_type = 'search'
      AND (e.query IS NOT NULL OR e.metadata->>'query' IS NOT NULL)
      AND e.created_at >= now() - interval '14 days'
    ORDER BY e.created_at DESC
    LIMIT 5
  ) recent;

  -- Build the result
  SELECT jsonb_build_object(
    'businesses', COALESCE((
      SELECT jsonb_agg(row_to_json(rec_businesses))
      FROM (
        SELECT
          b.id,
          b.name,
          b.category,
          b.address,
          b.created_at,
          COALESCE(trending.views_count, 0) as views_count
        FROM businesses b
        LEFT JOIN (
          -- Get trending scores for businesses
          SELECT
            business_id,
            COUNT(*) FILTER (WHERE event_type = 'business_view') as views_count
          FROM events
          WHERE created_at >= now() - interval '7 days'
          GROUP BY business_id
        ) trending ON trending.business_id = b.id
        WHERE b.category = ANY(v_top_categories)
          AND (v_viewed_business_ids IS NULL OR b.id != ALL(v_viewed_business_ids))
        ORDER BY trending.views_count DESC NULLS LAST, b.created_at DESC
        LIMIT 6
      ) rec_businesses
    ), '[]'::jsonb),
    'products', COALESCE((
      SELECT jsonb_agg(row_to_json(rec_products))
      FROM (
        SELECT
          p.id,
          p.name,
          p.price,
          p.image_url,
          p.business_id,
          b.name as business_name,
          b.category as business_category,
          COALESCE(trending.clicks_count, 0) as clicks_count
        FROM products p
        JOIN businesses b ON b.id = p.business_id
        LEFT JOIN (
          -- Get trending scores for products
          SELECT
            product_id,
            COUNT(*) as clicks_count
          FROM events
          WHERE event_type = 'product_click'
            AND created_at >= now() - interval '7 days'
          GROUP BY product_id
        ) trending ON trending.product_id = p.id
        WHERE b.category = ANY(v_top_categories)
        ORDER BY trending.clicks_count DESC NULLS LAST, p.created_at DESC
        LIMIT 8
      ) rec_products
    ), '[]'::jsonb),
    'top_categories', COALESCE(to_jsonb(v_top_categories), '[]'::jsonb),
    'recent_searches', COALESCE(to_jsonb(v_recent_searches), '[]'::jsonb),
    'is_personalized', true
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================
-- Helper Function: get_trending_fallback
-- Returns trending items when no personalization available
-- ============================================
CREATE OR REPLACE FUNCTION get_trending_fallback()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'businesses', COALESCE((
      SELECT jsonb_agg(row_to_json(trending_businesses))
      FROM (
        SELECT
          b.id,
          b.name,
          b.category,
          b.address,
          b.created_at,
          COALESCE(COUNT(e.id) FILTER (WHERE e.event_type = 'business_view'), 0) as views_count
        FROM businesses b
        LEFT JOIN events e ON e.business_id = b.id
          AND e.created_at >= now() - interval '7 days'
        GROUP BY b.id, b.name, b.category, b.address, b.created_at
        ORDER BY views_count DESC, b.created_at DESC
        LIMIT 6
      ) trending_businesses
    ), '[]'::jsonb),
    'products', COALESCE((
      SELECT jsonb_agg(row_to_json(trending_products))
      FROM (
        SELECT
          p.id,
          p.name,
          p.price,
          p.image_url,
          p.business_id,
          b.name as business_name,
          b.category as business_category,
          COALESCE(COUNT(e.id), 0) as clicks_count
        FROM products p
        JOIN businesses b ON b.id = p.business_id
        LEFT JOIN events e ON e.product_id = p.id
          AND e.event_type = 'product_click'
          AND e.created_at >= now() - interval '7 days'
        GROUP BY p.id, p.name, p.price, p.image_url, p.business_id, b.name, b.category
        ORDER BY clicks_count DESC, p.created_at DESC
        LIMIT 8
      ) trending_products
    ), '[]'::jsonb),
    'top_categories', '[]'::jsonb,
    'recent_searches', '[]'::jsonb,
    'is_personalized', false
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_recommendations_for_user(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_recommendations_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_fallback() TO anon;
GRANT EXECUTE ON FUNCTION get_trending_fallback() TO authenticated;
