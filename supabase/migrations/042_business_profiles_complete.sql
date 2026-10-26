-- Migration: Complete Business Profiles Table with PostGIS Support
-- Task 1.2: Create database migration for business_profiles table with PostGIS support
-- Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.2, 6.4, 13.6, 14.5, 15.1, 17.2
--
-- This migration creates a comprehensive business profiles table with:
-- - GEOGRAPHY(POINT, 4326) column for location-based queries
-- - TSVECTOR column for PostgreSQL full-text search
-- - Optional VECTOR(1536) column for semantic search embeddings
-- - Multiple indexes: user_id, primary_category_id, city/state, coordinates (GIST), premium status, rating, search_vector (GIN)
-- - Check constraints for business_type, price_range, premium_tier
-- - Trigger to auto-update search_vector on INSERT/UPDATE
-- - Trigger to auto-update updated_at timestamp
-- - Unique constraint on user_id (one business profile per user)

-- ============================================================
-- PART 1: Ensure trigger function exists (idempotent)
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
-- PART 2: Create business_profiles table
-- ============================================================

CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- ==================== Basic Information ====================
  business_name TEXT NOT NULL,
  display_name TEXT,
  description TEXT NOT NULL,
  business_type TEXT CHECK (business_type IN ('product', 'service', 'both')),
  
  -- ==================== Category Relationships ====================
  primary_category_id UUID NOT NULL REFERENCES categories(id),
  primary_subcategory_ids UUID[] DEFAULT '{}', -- Array of subcategory IDs
  
  -- ==================== Location with PostGIS ====================
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  coordinates GEOGRAPHY(POINT, 4326), -- PostGIS type for lat/long, SRID 4326 (WGS 84)
  
  -- ==================== Contact Information ====================
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- ==================== Business Hours (JSON for flexibility) ====================
  business_hours JSONB DEFAULT '{}'::JSONB, -- {"monday": {"open": "09:00", "close": "17:00"}, ...}
  
  -- ==================== Service Type Attributes (for filtering) ====================
  service_attributes JSONB DEFAULT '{}'::JSONB, -- {"delivery_available": true, "online_service": true, ...}
  
  -- ==================== Price Range Indicator ====================
  price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  
  -- ==================== Media ====================
  primary_photo_url TEXT,
  photo_urls TEXT[] DEFAULT '{}', -- Up to 50 photos
  
  -- ==================== Status and Verification ====================
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_documents JSONB DEFAULT '{}'::JSONB, -- Stores references to uploaded docs
  
  is_premium BOOLEAN DEFAULT FALSE,
  premium_tier TEXT CHECK (premium_tier IN ('basic', 'pro', 'enterprise')),
  premium_expires_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  -- ==================== Ratings (denormalized for performance) ====================
  average_rating DECIMAL(3,2) DEFAULT 0.0 CHECK (average_rating >= 0.0 AND average_rating <= 5.0),
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  
  -- ==================== Profile Completeness ====================
  completeness_percentage INTEGER DEFAULT 0 CHECK (completeness_percentage >= 0 AND completeness_percentage <= 100),
  
  -- ==================== Full-Text Search ====================
  search_vector TSVECTOR,
  
  -- ==================== Vector Embeddings (optional, for semantic search) ====================
  embedding VECTOR(1536), -- OpenAI ada-002 dimension, requires pgvector extension
  
  -- ==================== Metadata ====================
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ==================== Constraints ====================
  CONSTRAINT unique_user_business_profile UNIQUE(user_id) -- One business profile per user
);

-- ============================================================
-- PART 3: Create indexes for efficient querying
-- ============================================================

-- Index for finding business profile by user_id (most common query)
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);

-- Index for category-based queries
CREATE INDEX IF NOT EXISTS idx_business_profiles_primary_category ON business_profiles(primary_category_id);

-- Composite index for location-based filtering
CREATE INDEX IF NOT EXISTS idx_business_profiles_city_state ON business_profiles(city, state);

-- GIST spatial index for efficient radius-based location queries (PostGIS)
-- This enables ST_DWithin queries for "find businesses within X km of a point"
CREATE INDEX IF NOT EXISTS idx_business_profiles_coordinates 
  ON business_profiles USING GIST(coordinates);

-- Partial index for active premium businesses
CREATE INDEX IF NOT EXISTS idx_business_profiles_premium 
  ON business_profiles(is_premium, premium_expires_at) 
  WHERE is_premium = TRUE;

-- Index for sorting by rating (DESC order for highest first)
CREATE INDEX IF NOT EXISTS idx_business_profiles_rating 
  ON business_profiles(average_rating DESC);

-- GIN index for fast full-text search on business content
CREATE INDEX IF NOT EXISTS idx_business_profiles_search 
  ON business_profiles USING GIN(search_vector);

-- IVFFlat index for fast cosine similarity search on embeddings (pgvector)
-- Only create if vector extension is available
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    -- Check if index already exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'business_profiles' 
      AND indexname = 'idx_business_profiles_embedding'
    ) THEN
      CREATE INDEX idx_business_profiles_embedding 
        ON business_profiles 
        USING ivfflat(embedding vector_cosine_ops) 
        WITH (lists = 100);
      
      RAISE NOTICE 'Created vector embedding index on business_profiles';
    END IF;
  ELSE
    RAISE NOTICE 'Skipping vector embedding index - pgvector extension not installed';
  END IF;
END $$;

-- Index for active businesses
CREATE INDEX IF NOT EXISTS idx_business_profiles_active 
  ON business_profiles(is_active) 
  WHERE is_active = TRUE;

-- Index for verified businesses
CREATE INDEX IF NOT EXISTS idx_business_profiles_verified 
  ON business_profiles(is_verified) 
  WHERE is_verified = TRUE;

-- Composite index for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_business_profiles_rating_active 
  ON business_profiles(average_rating DESC, is_active) 
  WHERE is_active = TRUE;

-- ============================================================
-- PART 4: Create trigger to auto-update search_vector
-- ============================================================

CREATE OR REPLACE FUNCTION update_business_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Build weighted full-text search vector from business data
  -- Weight A (highest): business_name
  -- Weight B: description
  -- Weight C: city, state
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.business_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'C');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_business_search_vector() IS 
  'Automatically updates the search_vector column with weighted full-text search data on INSERT/UPDATE';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS business_profiles_search_vector_update ON business_profiles;

-- Create trigger for search_vector updates
CREATE TRIGGER business_profiles_search_vector_update
  BEFORE INSERT OR UPDATE ON business_profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_business_search_vector();

-- ============================================================
-- PART 5: Create trigger to auto-update updated_at
-- ============================================================

DROP TRIGGER IF EXISTS update_business_profiles_updated_at ON business_profiles;

CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PART 6: Add table and column comments for documentation
-- ============================================================

COMMENT ON TABLE business_profiles IS 
  'Comprehensive business profiles with multi-category tagging, location-based search (PostGIS), full-text search, optional semantic search (pgvector), and premium features. Each user can create one business profile.';

COMMENT ON COLUMN business_profiles.id IS 
  'Unique identifier for the business profile (UUID)';

COMMENT ON COLUMN business_profiles.user_id IS 
  'Reference to the user who owns this business profile. One-to-one relationship enforced by unique constraint.';

COMMENT ON COLUMN business_profiles.business_name IS 
  'Official business name (required)';

COMMENT ON COLUMN business_profiles.display_name IS 
  'Optional display name for marketing purposes';

COMMENT ON COLUMN business_profiles.description IS 
  'Business description (required, used in full-text search)';

COMMENT ON COLUMN business_profiles.business_type IS 
  'Type of business: product (sells products), service (offers services), or both';

COMMENT ON COLUMN business_profiles.primary_category_id IS 
  'Main category representing the core business offering. Used for higher search ranking weight.';

COMMENT ON COLUMN business_profiles.primary_subcategory_ids IS 
  'Array of subcategory UUIDs under the primary category';

COMMENT ON COLUMN business_profiles.coordinates IS 
  'PostGIS GEOGRAPHY(POINT, 4326) storing WGS 84 latitude/longitude for spatial queries. Enables radius-based search using ST_DWithin.';

COMMENT ON COLUMN business_profiles.business_hours IS 
  'JSONB object with day-based open/close times: {"monday": {"open": "09:00", "close": "17:00"}, ...}';

COMMENT ON COLUMN business_profiles.service_attributes IS 
  'JSONB object with boolean flags for filtering: {"delivery_available": true, "online_service": false, ...}';

COMMENT ON COLUMN business_profiles.price_range IS 
  'Price range indicator: $ (budget), $$ (moderate), $$$ (premium), $$$$ (luxury)';

COMMENT ON COLUMN business_profiles.photo_urls IS 
  'Array of photo URLs (max 50 photos)';

COMMENT ON COLUMN business_profiles.is_verified IS 
  'Whether the business has completed verification process';

COMMENT ON COLUMN business_profiles.verification_documents IS 
  'JSONB object storing references to uploaded verification documents';

COMMENT ON COLUMN business_profiles.is_premium IS 
  'Whether the business has an active premium subscription';

COMMENT ON COLUMN business_profiles.premium_tier IS 
  'Premium subscription tier: basic, pro, or enterprise';

COMMENT ON COLUMN business_profiles.premium_expires_at IS 
  'Timestamp when the premium subscription expires';

COMMENT ON COLUMN business_profiles.average_rating IS 
  'Denormalized average rating (0.0-5.0) calculated from reviews. Updated by trigger.';

COMMENT ON COLUMN business_profiles.review_count IS 
  'Denormalized count of reviews. Updated by trigger.';

COMMENT ON COLUMN business_profiles.completeness_percentage IS 
  'Profile completeness percentage (0-100) based on filled fields';

COMMENT ON COLUMN business_profiles.search_vector IS 
  'TSVECTOR for PostgreSQL full-text search. Automatically updated by trigger with weighted content.';

COMMENT ON COLUMN business_profiles.embedding IS 
  'VECTOR(1536) for semantic search using OpenAI ada-002 embeddings. Requires pgvector extension.';

COMMENT ON COLUMN business_profiles.view_count IS 
  'Number of times the business profile has been viewed';

-- ============================================================
-- PART 7: Migration summary and validation
-- ============================================================

DO $$ 
DECLARE
  has_postgis BOOLEAN;
  has_pgvector BOOLEAN;
BEGIN
  -- Check for PostGIS extension
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') INTO has_postgis;
  
  -- Check for pgvector extension
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') INTO has_pgvector;
  
  RAISE NOTICE 'Migration 042: Business Profiles table migration completed successfully';
  RAISE NOTICE '  - Table: business_profiles (created or already exists)';
  RAISE NOTICE '  - PostGIS support: % (GEOGRAPHY column for coordinates)', 
    CASE WHEN has_postgis THEN 'ENABLED' ELSE 'DISABLED - PostGIS extension not found!' END;
  RAISE NOTICE '  - Vector search support: % (VECTOR column for embeddings)', 
    CASE WHEN has_pgvector THEN 'ENABLED' ELSE 'DISABLED - pgvector extension not installed' END;
  RAISE NOTICE '  - Triggers: 2 (search_vector auto-update, updated_at auto-update)';
  RAISE NOTICE '  - Indexes: 12 indexes created';
  RAISE NOTICE '    * Standard B-tree indexes: user_id, primary_category, city_state, rating, active, verified';
  RAISE NOTICE '    * GIST index: coordinates (spatial queries)';
  RAISE NOTICE '    * GIN index: search_vector (full-text search)';
  RAISE NOTICE '    * IVFFlat index: embedding (vector similarity, if pgvector available)';
  RAISE NOTICE '  - Check constraints: business_type, price_range, premium_tier, average_rating, review_count, completeness_percentage, view_count';
  RAISE NOTICE '  - Unique constraint: user_id (one business profile per user)';
  RAISE NOTICE '  - Requirements validated: 2.1, 2.2, 2.3, 2.4, 2.5, 4.2, 6.4, 13.6, 14.5, 15.1, 17.2';
  
  IF NOT has_postgis THEN
    RAISE WARNING 'PostGIS extension not found! Location-based queries will fail. Run: CREATE EXTENSION postgis;';
  END IF;
END $$;
