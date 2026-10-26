-- Migration 058: Security Hardening Indexes (Fixed)
-- Date: 2025-01-23
-- Purpose: Create optimized indexes for RLS policy performance and browsing queries
-- Note: Uses standard CREATE INDEX (not CONCURRENTLY) because Supabase migrations run in transactions.

-- ============================================================
-- PART 1: Listings Table - RLS Policy Indexes
-- ============================================================

-- Index on user_id for owner queries (RLS policy: "Users can view own listings")
CREATE INDEX IF NOT EXISTS idx_listings_user_id 
  ON listings(user_id);

-- Index on status for filtering approved listings
CREATE INDEX IF NOT EXISTS idx_listings_status 
  ON listings(status);

-- Index on is_active for filtering active listings
CREATE INDEX IF NOT EXISTS idx_listings_is_active 
  ON listings(is_active);

-- Composite partial index for public listing queries
CREATE INDEX IF NOT EXISTS idx_listings_status_active 
  ON listings(status, is_active) 
  WHERE status = 'approved' AND is_active = true;

COMMENT ON INDEX idx_listings_user_id IS 
  'Optimizes owner queries in RLS policies (auth.uid() = user_id)';

COMMENT ON INDEX idx_listings_status IS 
  'Optimizes status filtering in public read RLS policy';

COMMENT ON INDEX idx_listings_is_active IS 
  'Optimizes is_active filtering in public read RLS policy';

COMMENT ON INDEX idx_listings_status_active IS 
  'Partial index optimized for public listing queries (approved + active only)';

-- ============================================================
-- PART 2: Listings Table - Category Browsing Index
-- ============================================================

-- Composite index for category browsing with RLS filters
CREATE INDEX IF NOT EXISTS idx_listings_category_browse 
  ON listings(category_id, state, is_active, status)
  WHERE is_active = true AND status = 'approved';

COMMENT ON INDEX idx_listings_category_browse IS 
  'Optimizes category browsing with location filter (approved + active listings only)';

-- ============================================================
-- PART 3: Listings Table - Location Browsing Index
-- ============================================================

-- Composite index for location browsing with RLS filters
CREATE INDEX IF NOT EXISTS idx_listings_location_browse 
  ON listings(state, lga, is_active, status)
  WHERE is_active = true AND status = 'approved';

COMMENT ON INDEX idx_listings_location_browse IS 
  'Optimizes location browsing (state + LGA) with RLS filters (approved + active listings only)';

-- ============================================================
-- PART 4: Product Listings Table - RLS Policy Indexes
-- ============================================================

-- Index on is_active for public read policy (using shorter name)
CREATE INDEX IF NOT EXISTS idx_product_listings_active 
  ON product_listings(is_active);

-- Index on business_profile_id for owner queries (using shorter name)
CREATE INDEX IF NOT EXISTS idx_product_listings_business 
  ON product_listings(business_profile_id);

COMMENT ON INDEX idx_product_listings_active IS 
  'Optimizes public read RLS policy (is_active = true filter)';

COMMENT ON INDEX idx_product_listings_business IS 
  'Optimizes business owner RLS policy (business_profile_id lookup)';

-- ============================================================
-- PART 5: Service Listings Table - RLS Policy Indexes
-- ============================================================

-- Index on is_active for public read policy (using shorter name)
CREATE INDEX IF NOT EXISTS idx_service_listings_active 
  ON service_listings(is_active);

-- Index on business_profile_id for owner queries (using shorter name)
CREATE INDEX IF NOT EXISTS idx_service_listings_business 
  ON service_listings(business_profile_id);

COMMENT ON INDEX idx_service_listings_active IS 
  'Optimizes public read RLS policy (is_active = true filter)';

COMMENT ON INDEX idx_service_listings_business IS 
  'Optimizes business owner RLS policy (business_profile_id lookup)';
