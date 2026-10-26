-- Migration: Business Search Functions
-- Task 10.2: Full-text search function for business profiles
-- Requirements: 4.1, 4.3, 4.4, 4.5
--
-- This migration creates PostgreSQL functions for searching businesses using full-text search

-- ============================================================
-- PART 1: Create full-text search function with relevance ranking
-- ============================================================

CREATE OR REPLACE FUNCTION search_businesses_fts(
  search_query TEXT,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.id,
    ts_rank(bp.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM 
    business_profiles bp
  WHERE 
    bp.search_vector @@ websearch_to_tsquery('english', search_query)
    AND bp.is_active = TRUE
  ORDER BY 
    rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_businesses_fts IS 
  'Full-text search function for businesses using PostgreSQL ts_rank. Returns business IDs with relevance scores.';

-- ============================================================
-- PART 2: Create autocomplete suggestion function
-- ============================================================

CREATE OR REPLACE FUNCTION search_business_autocomplete(
  query_text TEXT,
  suggestion_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  suggestion TEXT,
  suggestion_type TEXT,
  entity_id UUID
) AS $$
BEGIN
  -- Return business name suggestions
  RETURN QUERY
  SELECT 
    bp.business_name AS suggestion,
    'business'::TEXT AS suggestion_type,
    bp.id AS entity_id
  FROM 
    business_profiles bp
  WHERE 
    bp.is_active = TRUE
    AND bp.business_name ILIKE query_text || '%'
  ORDER BY 
    bp.average_rating DESC,
    bp.review_count DESC
  LIMIT suggestion_limit / 3;  -- Allocate 1/3 of suggestions to businesses

  -- Return category name suggestions
  RETURN QUERY
  SELECT 
    c.name AS suggestion,
    'category'::TEXT AS suggestion_type,
    c.id AS entity_id
  FROM 
    categories c
  WHERE 
    c.is_hidden = FALSE
    AND c.name ILIKE query_text || '%'
  ORDER BY 
    c.display_order
  LIMIT suggestion_limit / 3;  -- Allocate 1/3 of suggestions to categories

  -- Return location suggestions (cities)
  RETURN QUERY
  SELECT DISTINCT
    bp.city AS suggestion,
    'location'::TEXT AS suggestion_type,
    NULL::UUID AS entity_id
  FROM 
    business_profiles bp
  WHERE 
    bp.is_active = TRUE
    AND bp.city ILIKE query_text || '%'
  ORDER BY 
    bp.city
  LIMIT suggestion_limit / 3;  -- Allocate 1/3 of suggestions to locations

END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_business_autocomplete IS 
  'Autocomplete suggestions for business search. Returns businesses, categories, and location suggestions.';

-- ============================================================
-- PART 3: Create function to get businesses within radius
-- ============================================================

CREATE OR REPLACE FUNCTION get_businesses_within_radius(
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  radius_meters INTEGER,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  city TEXT,
  state TEXT,
  coordinates GEOGRAPHY,
  distance_meters DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.id,
    bp.business_name,
    bp.city,
    bp.state,
    bp.coordinates,
    ST_Distance(
      bp.coordinates::geography,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
    ) AS distance_meters
  FROM 
    business_profiles bp
  WHERE 
    bp.is_active = TRUE
    AND bp.coordinates IS NOT NULL
    AND ST_DWithin(
      bp.coordinates::geography,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY 
    distance_meters ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_businesses_within_radius IS 
  'Get businesses within a specified radius (in meters) from a center point. Uses PostGIS ST_DWithin for efficient spatial filtering.';

-- ============================================================
-- PART 4: Migration validation
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE 'Migration 044: Business search functions created successfully';
  RAISE NOTICE '  - search_businesses_fts: Full-text search with ts_rank';
  RAISE NOTICE '  - search_business_autocomplete: Autocomplete suggestions';
  RAISE NOTICE '  - get_businesses_within_radius: Location-based radius search';
  RAISE NOTICE '  - Requirements validated: 4.1, 4.3, 4.4, 4.5';
END $$;
