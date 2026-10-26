-- Migration: RLS Policies for New Tables
-- Task 1.2: Implement Row Level Security (RLS) policies
-- Requirements: 31.1

-- Enable RLS on new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Drop existing policies if they exist (to recreate with new logic)
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Policy: Profiles are viewable by everyone
CREATE POLICY "profiles_select_public"
  ON profiles
  FOR SELECT
  USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- ACTIVITIES POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "activities_select_public" ON activities;
DROP POLICY IF EXISTS "activities_insert_authenticated" ON activities;

-- Policy: Activities are viewable by everyone (for public activity feed)
CREATE POLICY "activities_select_public"
  ON activities
  FOR SELECT
  USING (true);

-- Policy: Only system/authenticated users can insert activities
-- (In practice, this will be done via triggers or backend functions)
CREATE POLICY "activities_insert_authenticated"
  ON activities
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- USER_INTERACTIONS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "user_interactions_select_own" ON user_interactions;
DROP POLICY IF EXISTS "user_interactions_insert_own" ON user_interactions;
DROP POLICY IF EXISTS "user_interactions_delete_own" ON user_interactions;

-- Policy: Users can view their own interactions
CREATE POLICY "user_interactions_select_own"
  ON user_interactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own interactions
CREATE POLICY "user_interactions_insert_own"
  ON user_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own interactions
CREATE POLICY "user_interactions_delete_own"
  ON user_interactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own" ON subscriptions;

-- Policy: Users can view their own subscriptions
CREATE POLICY "subscriptions_select_own"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "subscriptions_insert_own"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own subscriptions
CREATE POLICY "subscriptions_update_own"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- UPDATE EXISTING LISTINGS POLICIES FOR NEW REQUIREMENTS
-- ============================================================================

-- Drop existing policies if they exist (to recreate with new logic)
DROP POLICY IF EXISTS "listings_select_public" ON listings;
DROP POLICY IF EXISTS "listings_select_own" ON listings;
DROP POLICY IF EXISTS "listings_insert_own" ON listings;
DROP POLICY IF EXISTS "listings_update_own" ON listings;
DROP POLICY IF EXISTS "listings_delete_own" ON listings;

-- Policy: Public listings are viewable by everyone
-- Only show active, non-deleted listings to public
CREATE POLICY "listings_select_public"
  ON listings
  FOR SELECT
  USING (
    status = 'active' 
    AND deleted_at IS NULL 
    AND is_active = true
  );

-- Policy: Authenticated users can view their own listings (including drafts)
CREATE POLICY "listings_select_own"
  ON listings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own listings
CREATE POLICY "listings_insert_own"
  ON listings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own listings
CREATE POLICY "listings_update_own"
  ON listings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can soft-delete their own listings
CREATE POLICY "listings_delete_own"
  ON listings
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATE REVIEWS POLICIES FOR NEW REQUIREMENTS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_authenticated" ON reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
DROP POLICY IF EXISTS "reviews_vendor_response" ON reviews;

-- Policy: Reviews are viewable by everyone
CREATE POLICY "reviews_select_public"
  ON reviews
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert reviews
CREATE POLICY "reviews_insert_authenticated"
  ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Policy: Users can update their own reviews
CREATE POLICY "reviews_update_own"
  ON reviews
  FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- Policy: Vendors can respond to reviews about them
CREATE POLICY "reviews_vendor_response"
  ON reviews
  FOR UPDATE
  USING (auth.uid() = reviewed_user_id)
  WITH CHECK (auth.uid() = reviewed_user_id);

-- ============================================================================
-- COMMENTS ON POLICIES
-- ============================================================================

COMMENT ON POLICY "profiles_select_public" ON profiles IS 
  'Allow everyone to view all profiles for vendor discovery';

COMMENT ON POLICY "profiles_update_own" ON profiles IS 
  'Users can only update their own profile information';

COMMENT ON POLICY "activities_select_public" ON activities IS 
  'Public activity feed visible to all users for social proof';

COMMENT ON POLICY "user_interactions_select_own" ON user_interactions IS 
  'Users can only view their own interaction history';

COMMENT ON POLICY "subscriptions_select_own" ON subscriptions IS 
  'Users can only view their own subscription details';

COMMENT ON POLICY "listings_select_public" ON listings IS 
  'Only active, non-deleted listings are visible to public';

COMMENT ON POLICY "reviews_select_public" ON reviews IS 
  'All reviews are publicly visible for transparency';
