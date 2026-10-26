-- Fix Product and Service Listings Foreign Key Constraints
-- This migration fixes the foreign key constraints to reference business_profiles instead of businesses

-- Drop old constraints if they exist
ALTER TABLE IF EXISTS product_listings 
  DROP CONSTRAINT IF EXISTS product_listings_business_profile_id_fkey CASCADE;

ALTER TABLE IF EXISTS service_listings 
  DROP CONSTRAINT IF EXISTS service_listings_business_profile_id_fkey CASCADE;

-- Add correct constraints pointing to business_profiles
ALTER TABLE product_listings 
  ADD CONSTRAINT product_listings_business_profile_id_fkey 
  FOREIGN KEY (business_profile_id) 
  REFERENCES business_profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE service_listings 
  ADD CONSTRAINT service_listings_business_profile_id_fkey 
  FOREIGN KEY (business_profile_id) 
  REFERENCES business_profiles(id) 
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT product_listings_business_profile_id_fkey ON product_listings IS 
  'Foreign key to business_profiles table (fixed from businesses table)';

COMMENT ON CONSTRAINT service_listings_business_profile_id_fkey ON service_listings IS 
  'Foreign key to business_profiles table (fixed from businesses table)';
