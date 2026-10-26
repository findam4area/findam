-- Migration: Personalized Recommendations Infrastructure
-- Requirements: 7.1, 7.5
-- Description: Creates user_behaviors table to track user interactions for personalized recommendations

-- Create user_behaviors table
CREATE TABLE IF NOT EXISTS user_behaviors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Interaction tracking
  viewed_listings JSONB DEFAULT '[]'::jsonb, -- Array of {listing_id, timestamp, duration}
  saved_listings JSONB DEFAULT '[]'::jsonb, -- Array of {listing_id, timestamp}
  purchased_listings JSONB DEFAULT '[]'::jsonb, -- Array of {listing_id, timestamp, price}
  
  -- Search behavior
  search_queries JSONB DEFAULT '[]'::jsonb, -- Array of {query, timestamp, results_count}
  
  -- Preferences
  category_preferences JSONB DEFAULT '{}'::jsonb, -- Object with category_id as key, interaction_count as value
  price_range_min INTEGER DEFAULT 0,
  price_range_max INTEGER DEFAULT 999999999,
  location_preferences JSONB DEFAULT '[]'::jsonb, -- Array of location strings
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT user_behaviors_user_id_unique UNIQUE (user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_behaviors_user_id ON user_behaviors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_updated_at ON user_behaviors(updated_at);

-- Create GIN indexes for JSONB columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_behaviors_viewed_listings ON user_behaviors USING GIN (viewed_listings);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_saved_listings ON user_behaviors USING GIN (saved_listings);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_purchased_listings ON user_behaviors USING GIN (purchased_listings);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_category_preferences ON user_behaviors USING GIN (category_preferences);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_behaviors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_user_behaviors_updated_at
  BEFORE UPDATE ON user_behaviors
  FOR EACH ROW
  EXECUTE FUNCTION update_user_behaviors_updated_at();

-- Enable Row Level Security
ALTER TABLE user_behaviors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only read and update their own behavior data
CREATE POLICY "Users can view their own behavior data"
  ON user_behaviors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavior data"
  ON user_behaviors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own behavior data"
  ON user_behaviors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can access all behavior data for recommendation generation
CREATE POLICY "Service role can access all behavior data"
  ON user_behaviors
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create helper function to initialize user behavior record
CREATE OR REPLACE FUNCTION initialize_user_behavior(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_behavior_id UUID;
BEGIN
  INSERT INTO user_behaviors (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_behavior_id;
  
  IF v_behavior_id IS NULL THEN
    SELECT id INTO v_behavior_id FROM user_behaviors WHERE user_id = p_user_id;
  END IF;
  
  RETURN v_behavior_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to track listing view
CREATE OR REPLACE FUNCTION track_listing_view(
  p_user_id UUID,
  p_listing_id UUID,
  p_duration INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  v_view_data JSONB;
BEGIN
  -- Initialize user behavior if not exists
  PERFORM initialize_user_behavior(p_user_id);
  
  -- Create view data object
  v_view_data := jsonb_build_object(
    'listing_id', p_listing_id,
    'timestamp', NOW(),
    'duration', p_duration
  );
  
  -- Append to viewed_listings array (keep last 1000 views)
  UPDATE user_behaviors
  SET viewed_listings = (
    SELECT jsonb_agg(elem)
    FROM (
      SELECT elem
      FROM jsonb_array_elements(viewed_listings || v_view_data) elem
      ORDER BY (elem->>'timestamp')::timestamptz DESC
      LIMIT 1000
    ) sub
  )
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to track search query
CREATE OR REPLACE FUNCTION track_search_query(
  p_user_id UUID,
  p_query TEXT,
  p_results_count INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  v_search_data JSONB;
BEGIN
  -- Initialize user behavior if not exists
  PERFORM initialize_user_behavior(p_user_id);
  
  -- Create search data object
  v_search_data := jsonb_build_object(
    'query', p_query,
    'timestamp', NOW(),
    'results_count', p_results_count
  );
  
  -- Append to search_queries array (keep last 500 searches)
  UPDATE user_behaviors
  SET search_queries = (
    SELECT jsonb_agg(elem)
    FROM (
      SELECT elem
      FROM jsonb_array_elements(search_queries || v_search_data) elem
      ORDER BY (elem->>'timestamp')::timestamptz DESC
      LIMIT 500
    ) sub
  )
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to update category preference
CREATE OR REPLACE FUNCTION update_category_preference(
  p_user_id UUID,
  p_category_id TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Initialize user behavior if not exists
  PERFORM initialize_user_behavior(p_user_id);
  
  -- Increment category interaction count
  UPDATE user_behaviors
  SET category_preferences = jsonb_set(
    category_preferences,
    ARRAY[p_category_id],
    to_jsonb(COALESCE((category_preferences->>p_category_id)::integer, 0) + 1)
  )
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_behaviors TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_behavior TO authenticated;
GRANT EXECUTE ON FUNCTION track_listing_view TO authenticated;
GRANT EXECUTE ON FUNCTION track_search_query TO authenticated;
GRANT EXECUTE ON FUNCTION update_category_preference TO authenticated;
