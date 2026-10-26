-- ============================================================================
-- PRODUCT COMPARISON INFRASTRUCTURE
-- Requirements: 3.1, 3.6, 3.7, 3.8, 3.10
-- Tasks: 21.1, 21.2
-- ============================================================================

-- ============================================================================
-- Task 21.1: Create comparison_sets table
-- Requirements: 3.1, 3.7, 3.8
-- ============================================================================

CREATE TABLE IF NOT EXISTS comparison_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Store listing IDs as JSONB array (Requirements 3.1)
  listing_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Category validation (Requirement 3.10)
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Optional name for saved comparisons (Requirement 3.8)
  name TEXT,
  
  -- Session vs saved comparison
  is_saved BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT listing_ids_is_array CHECK (jsonb_typeof(listing_ids) = 'array'),
  CONSTRAINT listing_count_valid CHECK (
    jsonb_array_length(listing_ids) >= 2 AND 
    jsonb_array_length(listing_ids) <= 4
  ),
  CONSTRAINT saved_comparison_has_name CHECK (
    (is_saved = false) OR (is_saved = true AND name IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_comparison_sets_user_id ON comparison_sets(user_id);
CREATE INDEX idx_comparison_sets_category_id ON comparison_sets(category_id);
CREATE INDEX idx_comparison_sets_is_saved ON comparison_sets(is_saved);
CREATE INDEX idx_comparison_sets_created_at ON comparison_sets(created_at DESC);

-- GIN index for JSONB array queries
CREATE INDEX idx_comparison_sets_listing_ids ON comparison_sets USING GIN (listing_ids);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE comparison_sets ENABLE ROW LEVEL SECURITY;

-- Users can view their own comparison sets
CREATE POLICY "Users can view own comparison sets"
  ON comparison_sets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own comparison sets
CREATE POLICY "Users can create own comparison sets"
  ON comparison_sets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comparison sets
CREATE POLICY "Users can update own comparison sets"
  ON comparison_sets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comparison sets
CREATE POLICY "Users can delete own comparison sets"
  ON comparison_sets
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comparison_sets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_comparison_sets_updated_at
  BEFORE UPDATE ON comparison_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_comparison_sets_updated_at();

-- Function to clean up old session comparisons (not saved)
-- Run this periodically to remove comparisons older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_session_comparisons()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM comparison_sets
  WHERE is_saved = false
    AND created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE comparison_sets IS 'Stores product comparison sets for users (Requirements 3.1, 3.7, 3.8)';
COMMENT ON COLUMN comparison_sets.listing_ids IS 'Array of 2-4 listing IDs to compare (Requirement 3.1)';
COMMENT ON COLUMN comparison_sets.category_id IS 'Category ID for validation - all listings must be in same category (Requirement 3.10)';
COMMENT ON COLUMN comparison_sets.name IS 'Optional name for saved comparisons (Requirement 3.8)';
COMMENT ON COLUMN comparison_sets.is_saved IS 'Whether this is a saved comparison or session-only (Requirement 3.7, 3.8)';
