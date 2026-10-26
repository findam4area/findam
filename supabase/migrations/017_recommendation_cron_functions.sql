-- Migration: Recommendation Model Update Functions
-- Requirements: 7.4

-- Function to calculate category popularity
CREATE OR REPLACE FUNCTION calculate_category_popularity()
RETURNS TABLE (
  category_id UUID,
  popularity_score NUMERIC,
  total_views BIGINT,
  total_listings BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.category_id,
    (COUNT(DISTINCT l.id) * 0.3 + COALESCE(SUM(l.views_count), 0) * 0.7)::NUMERIC AS popularity_score,
    COALESCE(SUM(l.views_count), 0) AS total_views,
    COUNT(DISTINCT l.id) AS total_listings
  FROM listings l
  WHERE l.status = 'active'
    AND l.created_at > NOW() - INTERVAL '30 days'
  GROUP BY l.category_id
  ORDER BY popularity_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old behavior data
CREATE OR REPLACE FUNCTION cleanup_old_behavior_data(p_cutoff_date TIMESTAMPTZ)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_user_record RECORD;
  v_viewed_listings JSONB;
  v_saved_listings JSONB;
  v_search_queries JSONB;
BEGIN
  -- Loop through all user behaviors
  FOR v_user_record IN 
    SELECT user_id, viewed_listings, saved_listings, search_queries
    FROM user_behaviors
  LOOP
    -- Filter viewed_listings to keep only recent ones
    SELECT jsonb_agg(item)
    INTO v_viewed_listings
    FROM jsonb_array_elements(COALESCE(v_user_record.viewed_listings, '[]'::jsonb)) AS item
    WHERE (item->>'timestamp')::TIMESTAMPTZ > p_cutoff_date;

    -- Filter saved_listings to keep only recent ones
    SELECT jsonb_agg(item)
    INTO v_saved_listings
    FROM jsonb_array_elements(COALESCE(v_user_record.saved_listings, '[]'::jsonb)) AS item
    WHERE (item->>'timestamp')::TIMESTAMPTZ > p_cutoff_date;

    -- Filter search_queries to keep only recent ones
    SELECT jsonb_agg(item)
    INTO v_search_queries
    FROM jsonb_array_elements(COALESCE(v_user_record.search_queries, '[]'::jsonb)) AS item
    WHERE (item->>'timestamp')::TIMESTAMPTZ > p_cutoff_date;

    -- Update the user behavior record
    UPDATE user_behaviors
    SET 
      viewed_listings = COALESCE(v_viewed_listings, '[]'::jsonb),
      saved_listings = COALESCE(v_saved_listings, '[]'::jsonb),
      search_queries = COALESCE(v_search_queries, '[]'::jsonb),
      updated_at = NOW()
    WHERE user_id = v_user_record.user_id;

    v_updated_count := v_updated_count + 1;
  END LOOP;

  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user engagement scores
CREATE OR REPLACE FUNCTION calculate_user_engagement_scores()
RETURNS TABLE (
  user_id UUID,
  engagement_score NUMERIC,
  interaction_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ub.user_id,
    (
      jsonb_array_length(COALESCE(ub.viewed_listings, '[]'::jsonb)) * 1.0 +
      jsonb_array_length(COALESCE(ub.saved_listings, '[]'::jsonb)) * 2.0 +
      jsonb_array_length(COALESCE(ub.purchased_listings, '[]'::jsonb)) * 3.0 +
      jsonb_array_length(COALESCE(ub.search_queries, '[]'::jsonb)) * 1.5
    )::NUMERIC AS engagement_score,
    (
      jsonb_array_length(COALESCE(ub.viewed_listings, '[]'::jsonb)) +
      jsonb_array_length(COALESCE(ub.saved_listings, '[]'::jsonb)) +
      jsonb_array_length(COALESCE(ub.purchased_listings, '[]'::jsonb)) +
      jsonb_array_length(COALESCE(ub.search_queries, '[]'::jsonb))
    ) AS interaction_count
  FROM user_behaviors ub
  ORDER BY engagement_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_category_popularity() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_behavior_data(TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION calculate_user_engagement_scores() TO service_role;

COMMENT ON FUNCTION calculate_category_popularity() IS 'Calculates popularity scores for categories based on views and listing count - Requirement 7.4';
COMMENT ON FUNCTION cleanup_old_behavior_data(TIMESTAMPTZ) IS 'Removes old user behavior data older than cutoff date - Requirement 7.4';
COMMENT ON FUNCTION calculate_user_engagement_scores() IS 'Calculates engagement scores for users based on interactions - Requirement 7.4';
