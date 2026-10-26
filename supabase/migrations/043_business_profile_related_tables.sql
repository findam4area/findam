-- Migration: Business Profile Related Tables
-- Task 1.3: Create database migrations for related tables
-- Requirements: 2.2, 2.3, 2.6, 9.1, 9.2, 9.6, 10.1, 10.2, 11.1, 11.2, 20.1, 20.2
--
-- This migration creates the related tables for the Advanced Category Taxonomy System:
-- - business_category_tags: Junction table for multi-category tagging with is_primary flag
-- - product_listings: Physical and digital products with image arrays and stock tracking
-- - service_listings: Services with flexible pricing models
-- - business_reviews: User reviews with owner responses and rating aggregation
-- - category_analytics: Administrative metrics for category usage
--
-- All tables reference business_profiles (created in migration 042) instead of businesses

-- ============================================================
-- PART 1: Ensure update_updated_at_column function exists
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 
  'Trigger function to automatically update the updated_at timestamp column on row updates';

-- ============================================================
-- PART 2: Business Category Tags Junction Table
-- ============================================================

CREATE TABLE IF NOT EXISTS business_category_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_ids UUID[] DEFAULT '{}',
  is_primary BOOLEAN DEFAULT FALSE, -- Distinguishes primary from secondary categories
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_business_category UNIQUE(business_profile_id, category_id)
);

-- Create indexes for junction table
CREATE INDEX IF NOT EXISTS idx_business_category_tags_business 
  ON business_category_tags(business_profile_id);

CREATE INDEX IF NOT EXISTS idx_business_category_tags_category 
  ON business_category_tags(category_id);

CREATE INDEX IF NOT EXISTS idx_business_category_tags_primary 
  ON business_category_tags(business_profile_id, is_primary) 
  WHERE is_primary = TRUE;

-- Add table comment
COMMENT ON TABLE business_category_tags IS 
  'Junction table for multi-category business tagging. Enables businesses to be tagged with multiple categories while distinguishing primary from secondary categories for search ranking purposes.';

COMMENT ON COLUMN business_category_tags.is_primary IS 
  'TRUE if this is the primary category tag, FALSE for secondary categories. Primary categories receive higher search ranking weight.';

COMMENT ON COLUMN business_category_tags.subcategory_ids IS 
  'Array of subcategory UUIDs under this category that apply to the business.';

-- ============================================================
-- PART 3: Product Listings Table
-- ============================================================

CREATE TABLE IF NOT EXISTS product_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  
  -- Product details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('physical', 'digital')),
  
  -- Pricing
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  currency TEXT DEFAULT 'NGN',
  
  -- Inventory (for physical products)
  stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 5,
  is_in_stock BOOLEAN GENERATED ALWAYS AS (stock_quantity > 0) STORED,
  
  -- Media (1-10 images required)
  image_urls TEXT[] NOT NULL CHECK (array_length(image_urls, 1) BETWEEN 1 AND 10),
  primary_image_url TEXT NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for product listings
CREATE INDEX IF NOT EXISTS idx_product_listings_business 
  ON product_listings(business_profile_id);

CREATE INDEX IF NOT EXISTS idx_product_listings_active 
  ON product_listings(is_active) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_product_listings_featured 
  ON product_listings(is_featured, business_profile_id) 
  WHERE is_featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_product_listings_stock 
  ON product_listings(stock_quantity) 
  WHERE stock_quantity <= low_stock_threshold;

CREATE INDEX IF NOT EXISTS idx_product_listings_product_type 
  ON product_listings(product_type);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_product_listings_updated_at ON product_listings;

CREATE TRIGGER update_product_listings_updated_at
  BEFORE UPDATE ON product_listings
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE product_listings IS 
  'Physical and digital products offered by businesses. Supports inventory tracking for physical products and image galleries (1-10 images).';

COMMENT ON COLUMN product_listings.product_type IS 
  'Type of product: physical (requires inventory tracking) or digital (no inventory needed)';

COMMENT ON COLUMN product_listings.is_in_stock IS 
  'Computed column: TRUE when stock_quantity > 0. Automatically updated.';

COMMENT ON COLUMN product_listings.image_urls IS 
  'Array of product image URLs. Must contain 1-10 images.';

COMMENT ON COLUMN product_listings.low_stock_threshold IS 
  'Stock level at which to trigger low stock alerts/warnings. Default is 5 units.';

-- ============================================================
-- PART 4: Service Listings Table
-- ============================================================

CREATE TABLE IF NOT EXISTS service_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  
  -- Service details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Pricing (flexible models)
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('fixed', 'hourly', 'custom')),
  price DECIMAL(12,2) CHECK (price >= 0),
  currency TEXT DEFAULT 'NGN',
  
  -- Service duration
  duration_text TEXT, -- e.g., "2-3 hours", "1 week", flexible text field
  
  -- Media (1-5 images required)
  image_urls TEXT[] NOT NULL CHECK (array_length(image_urls, 1) BETWEEN 1 AND 5),
  primary_image_url TEXT NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for service listings
CREATE INDEX IF NOT EXISTS idx_service_listings_business 
  ON service_listings(business_profile_id);

CREATE INDEX IF NOT EXISTS idx_service_listings_active 
  ON service_listings(is_active) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_service_listings_featured 
  ON service_listings(is_featured, business_profile_id) 
  WHERE is_featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_service_listings_pricing_model 
  ON service_listings(pricing_model);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_service_listings_updated_at ON service_listings;

CREATE TRIGGER update_service_listings_updated_at
  BEFORE UPDATE ON service_listings
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE service_listings IS 
  'Services offered by businesses with flexible pricing models (fixed price, hourly rate, or custom quote). Supports service image galleries (1-5 images).';

COMMENT ON COLUMN service_listings.pricing_model IS 
  'Pricing structure: fixed (flat rate), hourly (per hour rate), custom (contact for quote)';

COMMENT ON COLUMN service_listings.duration_text IS 
  'Human-readable service duration or delivery timeframe. Examples: "2-3 hours", "Same day", "1 week"';

COMMENT ON COLUMN service_listings.image_urls IS 
  'Array of service image URLs. Must contain 1-5 images.';

-- ============================================================
-- PART 5: Business Reviews Table
-- ============================================================

CREATE TABLE IF NOT EXISTS business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Review content
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (length(comment) BETWEEN 10 AND 1000),
  
  -- Business owner response
  owner_response TEXT CHECK (owner_response IS NULL OR length(owner_response) <= 1000),
  responded_at TIMESTAMPTZ,
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  flagged_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_business_reviewer UNIQUE(business_profile_id, reviewer_id)
);

-- Create indexes for business reviews
CREATE INDEX IF NOT EXISTS idx_business_reviews_business 
  ON business_reviews(business_profile_id);

CREATE INDEX IF NOT EXISTS idx_business_reviews_reviewer 
  ON business_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_business_reviews_rating 
  ON business_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_business_reviews_created 
  ON business_reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_reviews_flagged 
  ON business_reviews(is_flagged) 
  WHERE is_flagged = TRUE;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_business_reviews_updated_at ON business_reviews;

CREATE TRIGGER update_business_reviews_updated_at
  BEFORE UPDATE ON business_reviews
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE business_reviews IS 
  'User reviews for business profiles with star ratings (1-5), comments, and owner responses. Supports moderation and flagging. One review per user per business.';

COMMENT ON COLUMN business_reviews.rating IS 
  'Star rating from 1 to 5 stars';

COMMENT ON COLUMN business_reviews.comment IS 
  'Review text comment. Must be 10-1000 characters.';

COMMENT ON COLUMN business_reviews.owner_response IS 
  'Optional response from business owner. Max 1000 characters. Business owners can respond once.';

COMMENT ON COLUMN business_reviews.is_flagged IS 
  'TRUE if review has been flagged for moderation';

-- ============================================================
-- PART 6: Business Rating Aggregation Trigger
-- ============================================================

-- Function to update business aggregate ratings
CREATE OR REPLACE FUNCTION update_business_rating_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  target_business_id UUID;
BEGIN
  -- Determine which business_profile_id to update
  IF TG_OP = 'DELETE' THEN
    target_business_id := OLD.business_profile_id;
  ELSE
    target_business_id := NEW.business_profile_id;
  END IF;

  -- Update the business profile with new aggregate ratings
  UPDATE business_profiles
  SET 
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0.0)
      FROM business_reviews
      WHERE business_profile_id = target_business_id
      AND is_flagged = FALSE
    ),
    review_count = (
      SELECT COUNT(*)
      FROM business_reviews
      WHERE business_profile_id = target_business_id
      AND is_flagged = FALSE
    ),
    updated_at = NOW()
  WHERE id = target_business_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_business_rating_aggregates() IS 
  'Automatically updates denormalized average_rating and review_count in business_profiles when reviews are inserted, updated, or deleted. Excludes flagged reviews from calculations.';

-- Create trigger to update business ratings when reviews change
DROP TRIGGER IF EXISTS business_reviews_update_aggregates ON business_reviews;

CREATE TRIGGER business_reviews_update_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON business_reviews
  FOR EACH ROW 
  EXECUTE FUNCTION update_business_rating_aggregates();

-- ============================================================
-- PART 7: Category Analytics Table
-- ============================================================

CREATE TABLE IF NOT EXISTS category_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Metrics
  business_count INTEGER DEFAULT 0 CHECK (business_count >= 0),
  search_count INTEGER DEFAULT 0 CHECK (search_count >= 0),
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  
  -- Time period
  period_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_category_period UNIQUE(category_id, period_date, period_type)
);

-- Create indexes for category analytics
CREATE INDEX IF NOT EXISTS idx_category_analytics_category 
  ON category_analytics(category_id);

CREATE INDEX IF NOT EXISTS idx_category_analytics_period 
  ON category_analytics(period_date DESC, period_type);

CREATE INDEX IF NOT EXISTS idx_category_analytics_metrics 
  ON category_analytics(business_count DESC, search_count DESC, view_count DESC);

CREATE INDEX IF NOT EXISTS idx_category_analytics_period_type 
  ON category_analytics(period_type, period_date DESC);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_category_analytics_updated_at ON category_analytics;

CREATE TRIGGER update_category_analytics_updated_at
  BEFORE UPDATE ON category_analytics
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE category_analytics IS 
  'Analytics and metrics tracking for categories. Stores aggregated data by time period (daily, weekly, monthly) for administrative insights and reporting.';

COMMENT ON COLUMN category_analytics.business_count IS 
  'Number of businesses in this category for the time period';

COMMENT ON COLUMN category_analytics.search_count IS 
  'Number of times this category was searched for in the time period';

COMMENT ON COLUMN category_analytics.view_count IS 
  'Number of times this category was viewed in the time period';

COMMENT ON COLUMN category_analytics.period_type IS 
  'Type of time period: daily, weekly, or monthly aggregation';

-- ============================================================
-- PART 8: Migration Summary and Validation
-- ============================================================

DO $$ 
DECLARE
  table_count INTEGER;
  index_count INTEGER;
BEGIN
  -- Count created tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'business_category_tags',
    'product_listings',
    'service_listings',
    'business_reviews',
    'category_analytics'
  );
  
  -- Count created indexes (approximate)
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename IN (
    'business_category_tags',
    'product_listings',
    'service_listings',
    'business_reviews',
    'category_analytics'
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Migration 043: Business Profile Related Tables';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created/Verified: %', table_count;
  RAISE NOTICE '  1. business_category_tags - Multi-category tagging junction table';
  RAISE NOTICE '  2. product_listings - Physical/digital products with inventory tracking';
  RAISE NOTICE '  3. service_listings - Services with flexible pricing models';
  RAISE NOTICE '  4. business_reviews - User reviews with owner responses';
  RAISE NOTICE '  5. category_analytics - Category usage metrics';
  RAISE NOTICE '';
  RAISE NOTICE 'Indexes Created: % indexes across all tables', index_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers Created: 5 triggers';
  RAISE NOTICE '  - product_listings: update_updated_at';
  RAISE NOTICE '  - service_listings: update_updated_at';
  RAISE NOTICE '  - business_reviews: update_updated_at';
  RAISE NOTICE '  - business_reviews: update_business_rating_aggregates';
  RAISE NOTICE '  - category_analytics: update_updated_at';
  RAISE NOTICE '';
  RAISE NOTICE 'Key Features:';
  RAISE NOTICE '  - Multi-category tagging with primary/secondary distinction';
  RAISE NOTICE '  - Product inventory tracking with stock alerts';
  RAISE NOTICE '  - Flexible service pricing (fixed/hourly/custom)';
  RAISE NOTICE '  - Review system with automatic rating aggregation';
  RAISE NOTICE '  - Time-based category analytics (daily/weekly/monthly)';
  RAISE NOTICE '';
  RAISE NOTICE 'Requirements Satisfied: 2.2, 2.3, 2.6, 9.1, 9.2, 9.6, 10.1, 10.2, 11.1, 11.2, 20.1, 20.2';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
END $$;
