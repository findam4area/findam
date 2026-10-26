-- Migration: 046_reviews_enhancements
-- Description: Add missing columns to reviews table for full review functionality
-- Requirements: 25.2, 25.3, 25.10
-- Date: 2024-01-10

-- Add images column to support optional review images (up to 5 images)
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Add comment to explain the column
COMMENT ON COLUMN reviews.images IS 'Array of image URLs for review photos (max 5 images per requirement 25.2)';

-- Verify all required columns exist (added in previous migrations)
-- These columns should already exist from migration 035, but we add them conditionally just in case

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

-- Create index on listing_id for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id);

-- Create index on vendor_id for vendor review queries
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON reviews(vendor_id);

-- Create index on reviewer_id for user's review history
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);

-- Create index on is_verified_purchase for filtering verified reviews
CREATE INDEX IF NOT EXISTS idx_reviews_verified_purchase ON reviews(is_verified_purchase);

-- Create composite index for duplicate prevention (Requirement 25.10)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_listing_reviewer 
ON reviews(reviewer_id, listing_id) 
WHERE listing_id IS NOT NULL;

-- Update RLS policies for reviews table
-- Allow authenticated users to insert reviews (Requirement 25.2)
DROP POLICY IF EXISTS "Users can insert reviews" ON reviews;
CREATE POLICY "Users can insert reviews" 
ON reviews FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

-- Allow everyone to read published reviews (Requirement 25.1)
DROP POLICY IF EXISTS "Reviews are publicly readable" ON reviews;
CREATE POLICY "Reviews are publicly readable" 
ON reviews FOR SELECT 
TO public
USING (true);

-- Allow reviewers to update their own reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews" 
ON reviews FOR UPDATE 
TO authenticated
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

-- Allow vendors to update vendor_response field on their reviews
DROP POLICY IF EXISTS "Vendors can respond to reviews" ON reviews;
CREATE POLICY "Vendors can respond to reviews" 
ON reviews FOR UPDATE 
TO authenticated
USING (auth.uid() = reviewed_user_id OR auth.uid() = vendor_id)
WITH CHECK (auth.uid() = reviewed_user_id OR auth.uid() = vendor_id);

-- Create function to update vendor rating after review insert/update (Requirement 25.7)
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vendor's average rating
  UPDATE users
  SET 
    rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM reviews
      WHERE reviewed_user_id = NEW.reviewed_user_id OR vendor_id = NEW.reviewed_user_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviewed_user_id = NEW.reviewed_user_id OR vendor_id = NEW.reviewed_user_id
    ),
    updated_at = NOW()
  WHERE id = NEW.reviewed_user_id;
  
  -- Also update vendor_id if different from reviewed_user_id
  IF NEW.vendor_id IS NOT NULL AND NEW.vendor_id != NEW.reviewed_user_id THEN
    UPDATE users
    SET 
      rating = (
        SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
        FROM reviews
        WHERE reviewed_user_id = NEW.vendor_id OR vendor_id = NEW.vendor_id
      ),
      review_count = (
        SELECT COUNT(*)
        FROM reviews
        WHERE reviewed_user_id = NEW.vendor_id OR vendor_id = NEW.vendor_id
      ),
      updated_at = NOW()
    WHERE id = NEW.vendor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic rating updates (Requirement 25.7)
DROP TRIGGER IF EXISTS trigger_update_vendor_rating ON reviews;
CREATE TRIGGER trigger_update_vendor_rating
AFTER INSERT OR UPDATE OF rating ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_vendor_rating();

-- Add comments for documentation
COMMENT ON TABLE reviews IS 'User reviews for listings and vendors. Supports purchase verification and vendor responses.';
COMMENT ON COLUMN reviews.is_verified_purchase IS 'True if reviewer purchased the listing (Requirement 25.3)';
COMMENT ON COLUMN reviews.helpfulness_votes IS 'Number of users who found this review helpful (Requirement 25.9)';
COMMENT ON COLUMN reviews.vendor_response IS 'Vendor''s public response to the review (Requirement 25.6, 25.8)';
COMMENT ON COLUMN reviews.vendor_responded_at IS 'Timestamp when vendor responded to the review';
