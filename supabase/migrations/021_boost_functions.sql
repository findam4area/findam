-- Migration: Boost Helper Functions
-- Requirements: 14.8 (Boost Performance Analytics)
-- Tasks: 34.9

-- ============================================================================
-- FUNCTION: Increment Boost Metric
-- ============================================================================
-- Atomically increment a boost performance metric (views, impressions, messages)

CREATE OR REPLACE FUNCTION increment_boost_metric(
  boost_id UUID,
  metric_field TEXT
)
RETURNS void AS $$
BEGIN
  -- Validate metric field
  IF metric_field NOT IN ('views_gained', 'impressions_gained', 'messages_received') THEN
    RAISE EXCEPTION 'Invalid metric field: %', metric_field;
  END IF;

  -- Increment the specified metric
  EXECUTE format('
    UPDATE boosts
    SET %I = %I + 1,
        updated_at = NOW()
    WHERE id = $1
      AND status = ''active''
      AND expires_at > NOW()
  ', metric_field, metric_field)
  USING boost_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Boosted Listing IDs for Ranking
-- ============================================================================
-- Returns array of listing IDs that are currently boosted
-- Used for prioritizing boosted listings in search and feed results

CREATE OR REPLACE FUNCTION get_boosted_listing_ids(
  p_category_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT NULL
)
RETURNS TABLE(listing_id UUID, boost_started_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.listing_id,
    b.started_at AS boost_started_at
  FROM boosts b
  INNER JOIN listings l ON b.listing_id = l.id
  WHERE b.status = 'active'
    AND b.expires_at > NOW()
    AND b.payment_status = 'completed'
    AND (p_category_id IS NULL OR l.category_id = p_category_id)
  ORDER BY b.started_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Check if Listing is Boosted
-- ============================================================================
-- Returns true if listing has an active boost

CREATE OR REPLACE FUNCTION is_listing_boosted(p_listing_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_active_boost BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM boosts
    WHERE listing_id = p_listing_id
      AND status = 'active'
      AND expires_at > NOW()
      AND payment_status = 'completed'
  ) INTO v_has_active_boost;
  
  RETURN v_has_active_boost;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION increment_boost_metric IS 'Atomically increment boost performance metrics (views_gained, impressions_gained, messages_received)';
COMMENT ON FUNCTION get_boosted_listing_ids IS 'Get listing IDs with active boosts for ranking prioritization';
COMMENT ON FUNCTION is_listing_boosted IS 'Check if a listing currently has an active boost';
