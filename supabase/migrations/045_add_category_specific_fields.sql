---
--- Migration: Add category_specific_fields column to business_profiles
--- Task 14.3: Display category-specific fields on business profile page
--- Requirements: 18.6
---
--- This migration adds a JSONB column to store category-specific fields
--- that vary based on the business's primary_category_id
---

-- ============================================================
-- Add category_specific_fields column
-- ============================================================

ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS category_specific_fields JSONB DEFAULT '{}'::JSONB;

-- Add comment for documentation
COMMENT ON COLUMN business_profiles.category_specific_fields IS 
  'JSONB object storing category-specific fields that vary by primary_category_id. 
  Examples:
  - Food & Beverage: {"cuisine_types": [...], "dietary_options": [...], "delivery_radius_km": 10}
  - Health & Medical: {"specializations": [...], "accepted_insurance": [...], "appointment_booking_url": "..."}
  - Real Estate: {"property_types": [...], "transaction_types": [...], "service_areas": [...]}
  - Automotive: {"brands_serviced": [...], "certifications": [...], "warranty_offered": true}';

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_business_profiles_category_specific_fields 
  ON business_profiles USING GIN(category_specific_fields);

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Successfully added category_specific_fields column to business_profiles';
END $$;
