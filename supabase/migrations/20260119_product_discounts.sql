-- ============================================
-- Product Discounts Feature Migration
-- ============================================

-- Add discount fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent integer NULL CHECK (discount_percent >= 0 AND discount_percent <= 100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_discount_active boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_started_at timestamptz NULL;

-- Create index for active discounts (for querying discounted products)
CREATE INDEX IF NOT EXISTS idx_products_discount_active ON products(is_discount_active) WHERE is_discount_active = true;

-- ============================================
-- Function to notify followers when discount is applied
-- ============================================
CREATE OR REPLACE FUNCTION notify_followers_on_discount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_business_name text;
  v_product_name text;
  v_discount_percent integer;
BEGIN
  -- Only trigger when discount is being activated (not deactivated)
  IF NEW.is_discount_active = true AND (OLD.is_discount_active = false OR OLD.is_discount_active IS NULL) THEN
    -- Get product and business info
    v_product_name := NEW.name;
    v_discount_percent := NEW.discount_percent;
    v_business_id := NEW.business_id;

    SELECT name INTO v_business_name FROM businesses WHERE id = v_business_id;

    -- Create notifications for all followers of this business
    INSERT INTO notifications (user_id, type, title, body, business_id, product_id)
    SELECT
      f.follower_id,
      'discount',
      v_discount_percent || '% off at ' || v_business_name,
      v_product_name || ' is now ' || v_discount_percent || '% off!',
      v_business_id,
      NEW.id
    FROM business_followers f
    WHERE f.business_id = v_business_id;

    -- Also create an event for analytics
    INSERT INTO events (event_type, business_id, product_id, metadata)
    VALUES (
      'discount_activated',
      v_business_id,
      NEW.id,
      jsonb_build_object(
        'discount_percent', v_discount_percent,
        'product_name', v_product_name
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for discount notifications
DROP TRIGGER IF EXISTS trigger_notify_followers_on_discount ON products;
CREATE TRIGGER trigger_notify_followers_on_discount
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION notify_followers_on_discount();

-- ============================================
-- RPC to get discounted products (for potential future use)
-- ============================================
CREATE OR REPLACE FUNCTION get_active_discounts(p_limit integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  name text,
  price numeric,
  discount_percent integer,
  discounted_price numeric,
  image_url text,
  business_id uuid,
  business_name text,
  business_category text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.price,
    p.discount_percent,
    ROUND(p.price * (1 - p.discount_percent::numeric / 100), 2) as discounted_price,
    p.image_url,
    p.business_id,
    b.name as business_name,
    b.category as business_category
  FROM products p
  JOIN businesses b ON b.id = p.business_id
  WHERE p.is_discount_active = true
    AND p.discount_percent > 0
  ORDER BY p.discount_started_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_active_discounts(integer) TO anon;
GRANT EXECUTE ON FUNCTION get_active_discounts(integer) TO authenticated;
