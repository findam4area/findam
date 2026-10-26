-- Verification Script for Task 1: Database Setup and Schema Implementation
-- Run this script after applying migrations 035, 036, and 037
-- Note: This script uses standard SQL and can be run through any SQL client

-- ============================================================================
-- SECTION 1: VERIFY EXTENSIONS
-- ============================================================================

-- Verifying Extensions
SELECT 
  extname as "Extension Name",
  extversion as "Version"
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'postgis', 'pg_trgm', 'vector')
ORDER BY extname;

-- ============================================================================
-- SECTION 2: VERIFY NEW TABLES
-- ============================================================================

-- Verifying New Tables
SELECT 
  table_name as "Table Name",
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as "Column Count"
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'activities', 'user_interactions', 'subscriptions')
ORDER BY table_name;

-- ============================================================================
-- SECTION 3: VERIFY LISTINGS TABLE ENHANCEMENTS
-- ============================================================================


SELECT 
  column_name as "Column Name",
  data_type as "Data Type",
  is_nullable as "Nullable"
FROM information_schema.columns 
WHERE table_name = 'listings' 
  AND column_name IN ('embedding', 'discount_percentage', 'original_price', 'deal_expires_at', 'boost_level', 'status', 'deleted_at')
ORDER BY column_name;

-- ============================================================================
-- SECTION 4: VERIFY INDEXES
-- ============================================================================


SELECT 
  tablename as "Table",
  indexname as "Index Name",
  indexdef as "Definition"
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname IN (
    'idx_listings_embedding',
    'idx_listings_deals',
    'idx_listings_status',
    'idx_profiles_verified',
    'idx_profiles_premium',
    'idx_profiles_rating',
    'idx_activities_type',
    'idx_activities_created',
    'idx_reviews_vendor',
    'idx_interactions_user',
    'idx_subscriptions_user'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 5: VERIFY RLS POLICIES
-- ============================================================================


SELECT 
  tablename as "Table",
  policyname as "Policy Name",
  cmd as "Command",
  permissive as "Permissive",
  roles as "Roles"
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'activities', 'user_interactions', 'subscriptions', 'listings', 'reviews')
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 6: VERIFY FUNCTIONS
-- ============================================================================


SELECT 
  routine_name as "Function Name",
  routine_type as "Type",
  data_type as "Return Type"
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'match_listings',
    'recommend_listings',
    'get_trending_listings',
    'update_vendor_rating',
    'update_profile_listing_count',
    'update_category_item_count',
    'create_activity_on_listing'
  )
ORDER BY routine_name;

-- ============================================================================
-- SECTION 7: VERIFY TRIGGERS
-- ============================================================================


SELECT 
  trigger_name as "Trigger Name",
  event_manipulation as "Event",
  event_object_table as "Table",
  action_timing as "Timing"
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_update_vendor_rating',
    'trigger_update_profile_listing_count',
    'trigger_update_category_item_count',
    'trigger_create_activity_on_listing'
  )
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SECTION 8: VERIFY TABLE ROW COUNTS
-- ============================================================================


SELECT 
  'profiles' as "Table",
  COUNT(*) as "Row Count"
FROM profiles
UNION ALL
SELECT 
  'activities' as "Table",
  COUNT(*) as "Row Count"
FROM activities
UNION ALL
SELECT 
  'user_interactions' as "Table",
  COUNT(*) as "Row Count"
FROM user_interactions
UNION ALL
SELECT 
  'subscriptions' as "Table",
  COUNT(*) as "Row Count"
FROM subscriptions;

-- ============================================================================
-- SECTION 9: TEST VECTOR SEARCH FUNCTION
-- ============================================================================


-- Test with a dummy embedding (all zeros)
SELECT 
  'match_listings' as "Function",
  COUNT(*) as "Results"
FROM match_listings(
  ARRAY_FILL(0::float, ARRAY[1536])::vector,
  0.0,
  10
);

-- ============================================================================
-- SECTION 10: TEST TRENDING LISTINGS FUNCTION
-- ============================================================================


SELECT 
  'get_trending_listings' as "Function",
  COUNT(*) as "Results"
FROM get_trending_listings(12, 7);

-- ============================================================================
-- SECTION 11: VERIFY CONSTRAINTS
-- ============================================================================


SELECT 
  conrelid::regclass as "Table",
  conname as "Constraint Name",
  contype as "Type",
  pg_get_constraintdef(oid) as "Definition"
FROM pg_constraint
WHERE conrelid::regclass::text IN ('profiles', 'activities', 'user_interactions', 'subscriptions', 'listings')
  AND contype IN ('c', 'f', 'p', 'u')
ORDER BY conrelid::regclass::text, contype, conname;

-- ============================================================================
-- SECTION 12: VERIFY CATEGORY SLUGS
-- ============================================================================


SELECT 
  name as "Category Name",
  slug as "Slug",
  item_count as "Item Count"
FROM categories
ORDER BY name
LIMIT 10;

-- ============================================================================
-- SUMMARY
-- ============================================================================


