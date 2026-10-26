-- Migration: Vector Search Functions and Triggers
-- Task 1.3: Create database functions and triggers
-- Requirements: 22.3, 25.7

-- ============================================================================
-- VECTOR SIMILARITY SEARCH FUNCTION
-- ============================================================================

-- Function: match_listings
-- Purpose: Perform vector similarity search on listings
-- Returns listings ordered by similarity score
CREATE OR REPLACE FUNCTION match_listings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price DECIMAL,
  thumbnail_url TEXT,
  state TEXT,
  lga TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.price,
    l.thumbnail_url,
    l.state,
    l.lga,
    1 - (l.embedding <=> query_embedding) AS similarity
  FROM listings l
  WHERE 
    l.status = 'active' 
    AND l.deleted_at IS NULL
    AND l.is_active = true
    AND l.embedding IS NOT NULL
    AND 1 - (l.embedding <=> query_embedding) > match_threshold
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Comment on function
COMMENT ON FUNCTION match_listings IS 
  'Performs vector similarity search on listings using cosine distance. Returns listings with similarity score above threshold.';

-- ============================================================================
-- PERSONALIZED RECOMMENDATIONS FUNCTION
-- ============================================================================

-- Function: recommend_listings
-- Purpose: Generate personalized recommendations based on user embedding
-- Excludes listings the user has already viewed recently
CREATE OR REPLACE FUNCTION recommend_listings(
  user_embedding VECTOR(1536),
  user_id_param UUID,
  match_count INT DEFAULT 8
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price DECIMAL,
  thumbnail_url TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.price,
    l.thumbnail_url,
    1 - (l.embedding <=> user_embedding) AS similarity
  FROM listings l
  WHERE 
    l.status = 'active'
    AND l.deleted_at IS NULL
    AND l.is_active = true
    AND l.embedding IS NOT NULL
    AND l.user_id != user_id_param
    AND l.id NOT IN (
      SELECT listing_id 
      FROM user_interactions 
      WHERE user_id = user_id_param 
        AND interaction_type = 'view'
        AND created_at > NOW() - INTERVAL '7 days'
    )
  ORDER BY l.embedding <=> user_embedding
  LIMIT match_count;
END;
$$;

-- Comment on function
COMMENT ON FUNCTION recommend_listings IS 
  'Generates personalized recommendations based on user embedding. Excludes recently viewed listings and listings from the same user.';

-- ============================================================================
-- VENDOR RATING UPDATE TRIGGER FUNCTION
-- ============================================================================

-- Function: update_vendor_rating
-- Purpose: Automatically update vendor rating when a review is added/updated
-- Calculates average rating and review count
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the vendor's profile with new rating statistics
  UPDATE profiles
  SET 
    rating = (
      SELECT AVG(rating)::DECIMAL(2,1)
      FROM reviews
      WHERE vendor_id = NEW.vendor_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE vendor_id = NEW.vendor_id
    ),
    updated_at = NOW()
  WHERE id = NEW.vendor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comment on function
COMMENT ON FUNCTION update_vendor_rating IS 
  'Trigger function that updates vendor rating and review count when a review is inserted or updated';

-- ============================================================================
-- CREATE TRIGGER ON REVIEWS TABLE
-- ============================================================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_vendor_rating ON reviews;

-- Create trigger to update vendor rating after review insert/update
CREATE TRIGGER trigger_update_vendor_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
WHEN (NEW.vendor_id IS NOT NULL)
EXECUTE FUNCTION update_vendor_rating();

-- Comment on trigger
COMMENT ON TRIGGER trigger_update_vendor_rating ON reviews IS 
  'Automatically updates vendor rating and review count when a review is added or modified';

-- ============================================================================
-- LISTING COUNT UPDATE TRIGGER FUNCTION
-- ============================================================================

-- Function: update_profile_listing_count
-- Purpose: Update profile listing count when listings are added/removed
CREATE OR REPLACE FUNCTION update_profile_listing_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment listing count
    UPDATE profiles
    SET 
      listing_count = listing_count + 1,
      updated_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement listing count
    UPDATE profiles
    SET 
      listing_count = GREATEST(listing_count - 1, 0),
      updated_at = NOW()
    WHERE id = OLD.user_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes (active to inactive or vice versa)
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE profiles
      SET 
        listing_count = GREATEST(listing_count - 1, 0),
        updated_at = NOW()
      WHERE id = NEW.user_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE profiles
      SET 
        listing_count = listing_count + 1,
        updated_at = NOW()
      WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comment on function
COMMENT ON FUNCTION update_profile_listing_count IS 
  'Trigger function that maintains accurate listing count on profiles';

-- ============================================================================
-- CREATE TRIGGER ON LISTINGS TABLE
-- ============================================================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_profile_listing_count ON listings;

-- Create trigger to update listing count
CREATE TRIGGER trigger_update_profile_listing_count
AFTER INSERT OR UPDATE OR DELETE ON listings
FOR EACH ROW
EXECUTE FUNCTION update_profile_listing_count();

-- Comment on trigger
COMMENT ON TRIGGER trigger_update_profile_listing_count ON listings IS 
  'Automatically updates profile listing count when listings are added, removed, or status changes';

-- ============================================================================
-- CATEGORY ITEM COUNT UPDATE TRIGGER FUNCTION
-- ============================================================================

-- Function: update_category_item_count
-- Purpose: Update category item count when listings are added/removed
-- Note: Includes NULL checks for category_id
CREATE OR REPLACE FUNCTION update_category_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment category item count (only if category_id is not null)
    IF NEW.category_id IS NOT NULL THEN
      UPDATE categories
      SET 
        item_count = item_count + 1,
        updated_at = NOW()
      WHERE id = NEW.category_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement category item count (only if category_id is not null)
    IF OLD.category_id IS NOT NULL THEN
      UPDATE categories
      SET 
        item_count = GREATEST(item_count - 1, 0),
        updated_at = NOW()
      WHERE id = OLD.category_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle category changes
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      -- Decrement old category (if not null)
      IF OLD.category_id IS NOT NULL THEN
        UPDATE categories
        SET 
          item_count = GREATEST(item_count - 1, 0),
          updated_at = NOW()
        WHERE id = OLD.category_id;
      END IF;
      
      -- Increment new category (if not null)
      IF NEW.category_id IS NOT NULL THEN
        UPDATE categories
        SET 
          item_count = item_count + 1,
          updated_at = NOW()
        WHERE id = NEW.category_id;
      END IF;
    END IF;
    
    -- Handle status changes (only if category_id is not null)
    IF NEW.category_id IS NOT NULL THEN
      IF OLD.status = 'active' AND NEW.status != 'active' THEN
        UPDATE categories
        SET 
          item_count = GREATEST(item_count - 1, 0),
          updated_at = NOW()
        WHERE id = NEW.category_id;
      ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
        UPDATE categories
        SET 
          item_count = item_count + 1,
          updated_at = NOW()
        WHERE id = NEW.category_id;
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comment on function
COMMENT ON FUNCTION update_category_item_count IS 
  'Trigger function that maintains accurate item count on categories';

-- ============================================================================
-- CREATE TRIGGER ON LISTINGS TABLE FOR CATEGORY COUNT
-- ============================================================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_category_item_count ON listings;

-- Create trigger to update category item count
-- Note: No WHEN clause - all logic handled inside the function
CREATE TRIGGER trigger_update_category_item_count
AFTER INSERT OR UPDATE OR DELETE ON listings
FOR EACH ROW
EXECUTE FUNCTION update_category_item_count();

-- Comment on trigger
COMMENT ON TRIGGER trigger_update_category_item_count ON listings IS 
  'Automatically updates category item count when listings are added, removed, or category changes';

-- ============================================================================
-- ACTIVITY FEED TRIGGER FUNCTION
-- ============================================================================

-- Function: create_activity_on_listing
-- Purpose: Create activity feed entry when new listing is created
CREATE OR REPLACE FUNCTION create_activity_on_listing()
RETURNS TRIGGER AS $$
DECLARE
  user_name_var TEXT;
  user_avatar_var TEXT;
BEGIN
  -- Get user information
  SELECT 
    COALESCE(p.name, u.username, u.email),
    COALESCE(p.avatar, u.avatar_url)
  INTO user_name_var, user_avatar_var
  FROM users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = NEW.user_id;
  
  -- Insert activity
  INSERT INTO activities (
    type,
    user_id,
    user_name,
    user_avatar,
    description,
    metadata
  ) VALUES (
    'listing',
    NEW.user_id,
    user_name_var,
    user_avatar_var,
    user_name_var || ' listed ' || NEW.title,
    jsonb_build_object(
      'listing_id', NEW.id,
      'listing_title', NEW.title,
      'listing_price', NEW.price,
      'listing_thumbnail', NEW.thumbnail_url
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comment on function
COMMENT ON FUNCTION create_activity_on_listing IS 
  'Trigger function that creates activity feed entry when a new listing is created';

-- ============================================================================
-- CREATE TRIGGER ON LISTINGS TABLE FOR ACTIVITY FEED
-- ============================================================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_activity_on_listing ON listings;

-- Create trigger to create activity on new listing
CREATE TRIGGER trigger_create_activity_on_listing
AFTER INSERT ON listings
FOR EACH ROW
WHEN (NEW.status = 'active' AND NEW.is_active = true)
EXECUTE FUNCTION create_activity_on_listing();

-- Comment on trigger
COMMENT ON TRIGGER trigger_create_activity_on_listing ON listings IS 
  'Automatically creates activity feed entry when a new active listing is created';

-- ============================================================================
-- HELPER FUNCTION: GET TRENDING LISTINGS
-- ============================================================================

-- Function: get_trending_listings
-- Purpose: Get trending listings based on views, likes, and recency
CREATE OR REPLACE FUNCTION get_trending_listings(
  limit_count INT DEFAULT 12,
  days_back INT DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price DECIMAL,
  thumbnail_url TEXT,
  state TEXT,
  lga TEXT,
  views_count INTEGER,
  likes_count INTEGER,
  trending_score DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.price,
    l.thumbnail_url,
    l.state,
    l.lga,
    l.views_count,
    l.likes_count,
    -- Trending score: weighted combination of views, likes, and recency
    (
      (l.views_count::DOUBLE PRECISION * 1.0) + 
      (l.likes_count::DOUBLE PRECISION * 2.0) + 
      (EXTRACT(EPOCH FROM (NOW() - l.created_at))::DOUBLE PRECISION / 3600.0 * -0.1)
    )::DOUBLE PRECISION AS trending_score
  FROM listings l
  WHERE 
    l.status = 'active'
    AND l.deleted_at IS NULL
    AND l.is_active = true
    AND l.created_at > NOW() - INTERVAL '1 day' * days_back
  ORDER BY trending_score DESC
  LIMIT limit_count;
END;
$$;

-- Comment on function
COMMENT ON FUNCTION get_trending_listings IS 
  'Returns trending listings based on views, likes, and recency with a calculated trending score';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION match_listings TO authenticated;
GRANT EXECUTE ON FUNCTION recommend_listings TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_listings TO authenticated;

-- Grant execute permissions to anonymous users for public functions
GRANT EXECUTE ON FUNCTION match_listings TO anon;
GRANT EXECUTE ON FUNCTION get_trending_listings TO anon;
