-- Migration: Recommendation Feedback System
-- Requirements: 7.8, 7.10

-- Create recommendation_feedback table
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('up', 'down')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate feedback for same listing
  UNIQUE(user_id, listing_id)
);

-- Create index for efficient queries
CREATE INDEX idx_recommendation_feedback_user ON recommendation_feedback(user_id);
CREATE INDEX idx_recommendation_feedback_listing ON recommendation_feedback(listing_id);
CREATE INDEX idx_recommendation_feedback_created ON recommendation_feedback(created_at);

-- Add personalized_recommendations_enabled to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS personalized_recommendations_enabled BOOLEAN DEFAULT TRUE;

-- Create index for privacy setting
CREATE INDEX IF NOT EXISTS idx_users_recommendations_enabled 
ON users(personalized_recommendations_enabled);

-- Enable RLS
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recommendation_feedback
CREATE POLICY "Users can insert their own feedback"
  ON recommendation_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON recommendation_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON recommendation_feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON recommendation_feedback
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can access all feedback for analytics
CREATE POLICY "Service role can access all feedback"
  ON recommendation_feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to get recommendation feedback stats
CREATE OR REPLACE FUNCTION get_recommendation_feedback_stats(p_listing_id UUID)
RETURNS TABLE (
  thumbs_up BIGINT,
  thumbs_down BIGINT,
  total_feedback BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE feedback_type = 'up') AS thumbs_up,
    COUNT(*) FILTER (WHERE feedback_type = 'down') AS thumbs_down,
    COUNT(*) AS total_feedback
  FROM recommendation_feedback
  WHERE listing_id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_recommendation_feedback_stats(UUID) TO authenticated;

COMMENT ON TABLE recommendation_feedback IS 'Stores user feedback on recommendations (thumbs up/down) - Requirement 7.8';
COMMENT ON COLUMN users.personalized_recommendations_enabled IS 'Privacy setting for personalized recommendations opt-out - Requirement 7.10';
