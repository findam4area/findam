/**
 * Fix Business Profiles Table
 * This script creates the business_profiles table if it doesn't exist
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixBusinessProfilesTable() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      FIX BUSINESS PROFILES TABLE                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('🔍 Checking if business_profiles table exists...\n');
  
  // Check if table exists
  const { data: existing, error: checkError } = await supabase
    .from('business_profiles')
    .select('id')
    .limit(0);
  
  if (!checkError || checkError.message.includes('limit')) {
    console.log('✅ business_profiles table already exists!\n');
    console.log('   No action needed. The table is properly set up.\n');
    return;
  }
  
  console.log('⚠️  business_profiles table does NOT exist\n');
  console.log('📋 Diagnosis: The related tables (product_listings, service_listings, etc.)');
  console.log('   exist but reference business_profiles which was never created.\n');
  console.log('   This happened because migration 042 was not applied.\n');
  
  console.log('💡 SOLUTION:\n');
  console.log('   You need to apply migration 042_business_profiles_complete.sql\n');
  console.log('   Options:\n');
  console.log('   1. Use Supabase SQL Editor (Recommended):\n');
  console.log(`      - Go to: ${SUPABASE_URL}/project/_/sql/new`);
  console.log('      - Copy contents of: supabase/migrations/042_business_profiles_complete.sql');
  console.log('      - Execute the SQL\n');
  console.log('   2. Use Supabase CLI:\n');
  console.log('      - Run: npx supabase db push');
  console.log('      - This will push any unapplied migrations\n');
  console.log('   3. Manual table creation:');
  console.log('      - See the SQL below and execute it in Supabase SQL Editor\n');
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('REQUIRED SQL (Copy this to Supabase SQL Editor):');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const createTableSQL = `
-- Create business_profiles table (from migration 042)
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  business_name TEXT NOT NULL,
  display_name TEXT,
  description TEXT NOT NULL,
  business_type TEXT CHECK (business_type IN ('product', 'service', 'both')),
  
  -- Category Relationships
  primary_category_id UUID NOT NULL REFERENCES categories(id),
  primary_subcategory_ids UUID[] DEFAULT '{}',
  
  -- Location with PostGIS
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  coordinates GEOGRAPHY(POINT, 4326),
  
  -- Contact Information
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Business Hours
  business_hours JSONB DEFAULT '{}'::JSONB,
  
  -- Service Type Attributes
  service_attributes JSONB DEFAULT '{}'::JSONB,
  
  -- Price Range
  price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  
  -- Media
  primary_photo_url TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  
  -- Status and Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_documents JSONB DEFAULT '{}'::JSONB,
  
  is_premium BOOLEAN DEFAULT FALSE,
  premium_tier TEXT CHECK (premium_tier IN ('basic', 'pro', 'enterprise')),
  premium_expires_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Ratings
  average_rating DECIMAL(3,2) DEFAULT 0.0 CHECK (average_rating >= 0.0 AND average_rating <= 5.0),
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  
  -- Profile Completeness
  completeness_percentage INTEGER DEFAULT 0 CHECK (completeness_percentage >= 0 AND completeness_percentage <= 100),
  
  -- Full-Text Search
  search_vector TSVECTOR,
  
  -- Vector Embeddings (optional)
  embedding VECTOR(1536),
  
  -- Metadata
  view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_business_profile UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_primary_category ON business_profiles(primary_category_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_city_state ON business_profiles(city, state);
CREATE INDEX IF NOT EXISTS idx_business_profiles_coordinates ON business_profiles USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_business_profiles_premium ON business_profiles(is_premium, premium_expires_at) WHERE is_premium = TRUE;
CREATE INDEX IF NOT EXISTS idx_business_profiles_rating ON business_profiles(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_business_profiles_search ON business_profiles USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_business_profiles_active ON business_profiles(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_business_profiles_verified ON business_profiles(is_verified) WHERE is_verified = TRUE;

-- Create triggers
CREATE OR REPLACE FUNCTION update_business_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.business_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS business_profiles_search_vector_update ON business_profiles;
CREATE TRIGGER business_profiles_search_vector_update
  BEFORE INSERT OR UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_business_search_vector();

DROP TRIGGER IF EXISTS update_business_profiles_updated_at ON business_profiles;
CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;
  
  console.log(createTableSQL);
  console.log('\n═══════════════════════════════════════════════════════════════\n');
  
  console.log('❗ IMPORTANT: After applying the SQL, run the verification script:');
  console.log('   npx tsx scripts/verify-database-setup.ts\n');
}

fixBusinessProfilesTable().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
