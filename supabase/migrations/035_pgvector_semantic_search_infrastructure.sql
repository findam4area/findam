-- Migration: pgvector Semantic Search Infrastructure
-- Task 1.1: Enable pgvector extension and create vector search infrastructure
-- Requirements: 22.1, 22.5

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to existing listings table
-- Using VECTOR(1536) for OpenAI ada-002 embeddings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);

-- Create HNSW index on embedding column for fast similarity search
-- Using cosine distance operator for similarity
CREATE INDEX IF NOT EXISTS idx_listings_embedding 
ON listings 
USING hnsw (embedding vector_cosine_ops);

-- Create profiles table (extends users table with vendor-specific data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  listing_count INTEGER DEFAULT 0,
  specialties TEXT[],
  phone_verified BOOLEAN DEFAULT FALSE,
  nin_verified BOOLEAN DEFAULT FALSE,
  video_verified BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_tier VARCHAR(20) CHECK (premium_tier IN ('basic', 'pro', 'enterprise')),
  premium_expires_at TIMESTAMPTZ,
  response_time_hours DECIMAL(5, 2),
  total_sales INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_verified 
ON profiles(phone_verified, nin_verified, video_verified);

CREATE INDEX IF NOT EXISTS idx_profiles_premium 
ON profiles(is_premium, premium_expires_at);

CREATE INDEX IF NOT EXISTS idx_profiles_rating 
ON profiles(rating DESC);

-- Create activities table for real-time activity feed
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('listing', 'purchase', 'registration', 'review')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for activities
CREATE INDEX IF NOT EXISTS idx_activities_type 
ON activities(type);

CREATE INDEX IF NOT EXISTS idx_activities_created 
ON activities(created_at DESC);

-- Update reviews table to include vendor_id for vendor ratings
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT FALSE;

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS helpfulness_votes INTEGER DEFAULT 0;

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS vendor_response TEXT;

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS vendor_responded_at TIMESTAMPTZ;

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Create index for vendor reviews
CREATE INDEX IF NOT EXISTS idx_reviews_vendor 
ON reviews(vendor_id);

CREATE INDEX IF NOT EXISTS idx_reviews_rating 
ON reviews(rating);

-- Create user_interactions table for tracking user behavior
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) CHECK (interaction_type IN ('view', 'like', 'save', 'share', 'contact')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_interactions
CREATE INDEX IF NOT EXISTS idx_interactions_user 
ON user_interactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interactions_listing 
ON user_interactions(listing_id);

CREATE INDEX IF NOT EXISTS idx_interactions_type 
ON user_interactions(interaction_type);

-- Create subscriptions table for premium subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'pro', 'enterprise')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'grace_period')),
  billing_cycle VARCHAR(10) CHECK (billing_cycle IN ('monthly', 'annual')),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  paystack_subscription_code TEXT,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user 
ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
ON subscriptions(status);

-- Add additional fields to listings table for deals and discounts
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(12, 2);

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS deal_expires_at TIMESTAMPTZ;

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS boost_level INTEGER CHECK (boost_level IN (1, 2, 3));

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for deals
CREATE INDEX IF NOT EXISTS idx_listings_deals 
ON listings(discount_percentage, deal_expires_at) 
WHERE discount_percentage > 0 AND deal_expires_at IS NOT NULL;

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_listings_status 
ON listings(status);

-- Add slug column to categories for SEO-friendly URLs
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS accent_color TEXT;

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS item_count INTEGER DEFAULT 0;

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for category hierarchy
CREATE INDEX IF NOT EXISTS idx_categories_parent 
ON categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_categories_slug 
ON categories(slug);

-- Populate profiles table from existing users
INSERT INTO profiles (
  id, 
  name, 
  avatar, 
  bio, 
  phone_verified, 
  nin_verified, 
  video_verified, 
  is_premium, 
  premium_expires_at,
  created_at,
  updated_at
)
SELECT 
  id,
  COALESCE(username, email) as name,
  avatar_url as avatar,
  bio,
  phone_verified,
  nin_verified,
  video_verified,
  is_premium,
  premium_expires_at,
  created_at,
  updated_at
FROM users
ON CONFLICT (id) DO NOTHING;

-- Update category slugs from names (if not already set)
UPDATE categories 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Comment on tables and columns for documentation
COMMENT ON TABLE profiles IS 'Extended user profiles with vendor-specific information';
COMMENT ON TABLE activities IS 'Real-time activity feed for homepage display';
COMMENT ON TABLE user_interactions IS 'Tracks user behavior for recommendations and analytics';
COMMENT ON TABLE subscriptions IS 'Premium subscription management';
COMMENT ON COLUMN listings.embedding IS 'Vector embedding (1536 dimensions) for semantic search using OpenAI ada-002';
COMMENT ON INDEX idx_listings_embedding IS 'HNSW index for fast cosine similarity search on embeddings';
