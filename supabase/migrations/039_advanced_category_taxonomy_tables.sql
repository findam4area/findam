-- Migration: Advanced Category Taxonomy System with Business Profiles
-- Task 1.3: Create database migrations for related tables
-- Requirements: 2.2, 2.3, 2.6, 9.1, 9.2, 9.6, 10.1, 10.2, 11.1, 11.2, 20.1, 20.2

-- ============================================================
-- PART 1: Enhance Existing Categories Table
-- ============================================================

-- Add new columns to existing categories table for hierarchical taxonomy
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_translations JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS description_translations JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add constraint to prevent duplicate names at same hierarchy level
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_parent_unique;
ALTER TABLE categories ADD CONSTRAINT categories_name_parent_unique 
  UNIQUE(name, parent_id);

-- Create indexes for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_name_translations ON categories USING GIN(name_translations);

-- Drop old unique constraint on name only (since we now have name+parent_id uniqueness)
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- ============================================================
-- PART 2: Business Category Tags Junction Table
-- ============================================================

CREATE TABLE IF NOT EXISTS business_category_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_ids UUID[] DEFAULT '{}',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_profile_id, category_id)
);

-- Create indexes for junction table
CREATE INDEX IF NOT EXISTS idx_business_category_tags_business 
  ON business_category_tags(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_business_category_tags_category 
  ON business_category_tags(category_id);
CREATE INDEX IF NOT EXISTS idx_business_category_tags_primary 
  ON business_category_tags(business_profile_id, is_primary) WHERE is_primary = TRUE;

-- ============================================================
-- PART 3: Product Listings Table
-- ============================================================

CREATE TABLE IF NOT EXISTS product_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
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
  
  -- Media
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
  ON product_listings(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_product_listings_featured 
  ON product_listings(is_featured, business_profile_id) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_product_listings_stock 
  ON product_listings(stock_quantity) WHERE stock_quantity <= low_stock_threshold;

-- ============================================================
-- PART 4: Service Listings Table
-- ============================================================

CREATE TABLE IF NOT EXISTS service_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Service details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Pricing
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('fixed', 'hourly', 'custom')),
  price DECIMAL(12,2) CHECK (price >= 0),
  currency TEXT DEFAULT 'NGN',
  
  -- Service duration
  duration_text TEXT,
  
  -- Media
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
  ON service_listings(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_service_listings_featured 
  ON service_listings(is_featured, business_profile_id) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_service_listings_pricing_model 
  ON service_listings(pricing_model);

-- ============================================================
-- PART 5: Business Reviews Table
-- ============================================================

CREATE TABLE IF NOT EXISTS business_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
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
  
  UNIQUE(business_profile_id, reviewer_id)
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
  ON business_reviews(is_flagged) WHERE is_flagged = TRUE;

-- ============================================================
-- PART 6: Category Analytics Table
-- ============================================================

CREATE TABLE IF NOT EXISTS category_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Metrics
  business_count INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  -- Time period
  period_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(category_id, period_date, period_type)
);

-- Create indexes for category analytics
CREATE INDEX IF NOT EXISTS idx_category_analytics_category 
  ON category_analytics(category_id);
CREATE INDEX IF NOT EXISTS idx_category_analytics_period 
  ON category_analytics(period_date DESC, period_type);
CREATE INDEX IF NOT EXISTS idx_category_analytics_metrics 
  ON category_analytics(business_count DESC, search_count DESC, view_count DESC);

-- ============================================================
-- PART 7: Triggers and Functions
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on categories (if not exists)
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for product_listings updated_at
DROP TRIGGER IF EXISTS update_product_listings_updated_at ON product_listings;
CREATE TRIGGER update_product_listings_updated_at
  BEFORE UPDATE ON product_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for service_listings updated_at
DROP TRIGGER IF EXISTS update_service_listings_updated_at ON service_listings;
CREATE TRIGGER update_service_listings_updated_at
  BEFORE UPDATE ON service_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for business_reviews updated_at
DROP TRIGGER IF EXISTS update_business_reviews_updated_at ON business_reviews;
CREATE TRIGGER update_business_reviews_updated_at
  BEFORE UPDATE ON business_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for category_analytics updated_at
DROP TRIGGER IF EXISTS update_category_analytics_updated_at ON category_analytics;
CREATE TRIGGER update_category_analytics_updated_at
  BEFORE UPDATE ON category_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PART 8: Business Rating Aggregation Trigger
-- ============================================================

-- Function to update business aggregate ratings
CREATE OR REPLACE FUNCTION update_business_rating_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  business_id UUID;
BEGIN
  -- Determine which business_profile_id to update
  IF TG_OP = 'DELETE' THEN
    business_id := OLD.business_profile_id;
  ELSE
    business_id := NEW.business_profile_id;
  END IF;

  -- Update the business with new aggregate ratings
  UPDATE businesses
  SET 
    updated_at = NOW()
  WHERE id = business_id;
  
  -- Note: We'll add average_rating and review_count columns to businesses table in a separate migration
  -- This trigger is prepared for when those columns exist
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update business ratings when reviews change
DROP TRIGGER IF EXISTS business_reviews_update_aggregates ON business_reviews;
CREATE TRIGGER business_reviews_update_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON business_reviews
  FOR EACH ROW EXECUTE FUNCTION update_business_rating_aggregates();

-- ============================================================
-- PART 9: Add Columns to Businesses Table
-- ============================================================

-- Add columns to support business profiles features
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT CHECK (business_type IN ('product', 'service', 'both')),
  ADD COLUMN IF NOT EXISTS primary_category_id UUID REFERENCES categories(id),
  ADD COLUMN IF NOT EXISTS primary_subcategory_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_attributes JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  ADD COLUMN IF NOT EXISTS primary_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_tier TEXT CHECK (premium_tier IN ('basic', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completeness_percentage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create additional indexes on businesses table
CREATE INDEX IF NOT EXISTS idx_businesses_primary_category 
  ON businesses(primary_category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_city_state 
  ON businesses(city, state) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_premium 
  ON businesses(is_premium, premium_expires_at) WHERE is_premium = TRUE;
CREATE INDEX IF NOT EXISTS idx_businesses_rating 
  ON businesses(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_search 
  ON businesses USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_businesses_active 
  ON businesses(is_active) WHERE is_active = TRUE;

-- ============================================================
-- PART 10: Business Search Vector Trigger
-- ============================================================

-- Function to update business search vector
CREATE OR REPLACE FUNCTION update_business_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update search vector on businesses
DROP TRIGGER IF EXISTS businesses_search_vector_update ON businesses;
CREATE TRIGGER businesses_search_vector_update
  BEFORE INSERT OR UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_business_search_vector();

-- ============================================================
-- PART 11: Enhanced Business Rating Aggregation
-- ============================================================

-- Update the rating aggregation function to populate the new columns
CREATE OR REPLACE FUNCTION update_business_rating_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  business_id UUID;
BEGIN
  -- Determine which business_profile_id to update
  IF TG_OP = 'DELETE' THEN
    business_id := OLD.business_profile_id;
  ELSE
    business_id := NEW.business_profile_id;
  END IF;

  -- Update the business with new aggregate ratings
  UPDATE businesses
  SET 
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0.0)
      FROM business_reviews
      WHERE business_profile_id = business_id
      AND is_flagged = FALSE
    ),
    review_count = (
      SELECT COUNT(*)
      FROM business_reviews
      WHERE business_profile_id = business_id
      AND is_flagged = FALSE
    ),
    updated_at = NOW()
  WHERE id = business_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger (it was dropped earlier)
DROP TRIGGER IF EXISTS business_reviews_update_aggregates ON business_reviews;
CREATE TRIGGER business_reviews_update_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON business_reviews
  FOR EACH ROW EXECUTE FUNCTION update_business_rating_aggregates();

-- ============================================================
-- PART 12: Comments
-- ============================================================

-- Comment on tables and columns for documentation
COMMENT ON TABLE business_category_tags IS 'Junction table for multi-category business tagging with primary/secondary distinction';
COMMENT ON TABLE product_listings IS 'Physical and digital products offered by businesses';
COMMENT ON TABLE service_listings IS 'Services offered by businesses with flexible pricing models';
COMMENT ON TABLE business_reviews IS 'User reviews for businesses with rating aggregation';
COMMENT ON TABLE category_analytics IS 'Analytics tracking for category usage and performance';

COMMENT ON COLUMN categories.name_translations IS 'Multi-language translations stored as JSON: {"yo": "Yoruba", "ig": "Igbo", "ha": "Hausa"}';
COMMENT ON COLUMN categories.parent_id IS 'Self-referencing FK for hierarchical taxonomy (main categories and subcategories)';
COMMENT ON COLUMN business_category_tags.is_primary IS 'Distinguishes primary category from secondary categories for search ranking';
COMMENT ON COLUMN product_listings.is_in_stock IS 'Computed column: TRUE when stock_quantity > 0';
COMMENT ON COLUMN service_listings.pricing_model IS 'Pricing structure: fixed (flat rate), hourly (per hour), custom (contact for quote)';
COMMENT ON COLUMN business_reviews.owner_response IS 'Business owner can respond once to each review';
COMMENT ON COLUMN businesses.search_vector IS 'Full-text search vector updated automatically via trigger';
COMMENT ON COLUMN businesses.average_rating IS 'Denormalized aggregate rating, updated via trigger on business_reviews changes';
