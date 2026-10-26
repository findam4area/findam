-- Migration: Update listings table for marketplace functionality
-- This migration updates the listings schema to support:
-- - Multi-image uploads (images array + primary_image_index)
-- - Manual approval workflow (status + rejection_reason)
-- - Featured listings (is_featured)
-- - Simplified location fields (location_state + location_city instead of state/lga/ward)

-- Requirements: 13.1, 13.2, 3.1

BEGIN;

-- Add new columns for multi-image support
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS primary_image_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS location_state TEXT,
  ADD COLUMN IF NOT EXISTS location_city TEXT;

-- Add status column with proper type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE listings ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add rejection_reason column
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Migrate existing location data: state -> location_state, lga -> location_city
UPDATE listings
  SET location_state = COALESCE(location_state, state),
      location_city = COALESCE(location_city, lga)
  WHERE location_state IS NULL AND state IS NOT NULL;

-- Drop existing constraints if they exist, then recreate them
DO $$
BEGIN
  -- Drop constraints if they exist
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_images_count') THEN
    ALTER TABLE listings DROP CONSTRAINT valid_images_count;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_primary_image') THEN
    ALTER TABLE listings DROP CONSTRAINT valid_primary_image;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'listings_status_check') THEN
    ALTER TABLE listings DROP CONSTRAINT listings_status_check;
  END IF;
  
  -- Add constraints
  ALTER TABLE listings ADD CONSTRAINT valid_images_count 
    CHECK (array_length(images, 1) IS NULL OR (array_length(images, 1) >= 1 AND array_length(images, 1) <= 5));
  
  ALTER TABLE listings ADD CONSTRAINT valid_primary_image 
    CHECK (primary_image_index >= 0 AND (array_length(images, 1) IS NULL OR primary_image_index < array_length(images, 1)));
  
  ALTER TABLE listings ADD CONSTRAINT listings_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected'));
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_is_featured ON listings(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_listings_location_state ON listings(location_state);
CREATE INDEX IF NOT EXISTS idx_listings_location_city ON listings(location_city);

-- Update existing listings to have appropriate status
UPDATE listings
  SET status = 'approved'
  WHERE status IS NULL OR status = '';

COMMIT;