-- Migration: Marketplace Functionality Enhancement - Core Schema with Multi-Image Support
-- Task 1.4: Create database migration for core schema with multi-image support
-- Requirements: 13.1, 13.2, 15.1, 15.2

-- ============================================================================
-- USERS TABLE ENHANCEMENTS
-- ============================================================================

-- Add full_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'users' 
                 AND column_name = 'full_name') THEN
    ALTER TABLE users ADD COLUMN full_name TEXT;
  END IF;
END $$;

-- Add role column with all operations
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if role column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'role'
  ) INTO column_exists;
  
  -- Add column if it doesn't exist
  IF NOT column_exists THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
  
  -- Now update nulls (column is guaranteed to exist)
  UPDATE users SET role = 'user' WHERE role IS NULL;
  
  -- Make role NOT NULL if it isn't already
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'users' 
    AND column_name = 'role' 
    AND is_nullable = 'YES'
  ) INTO column_exists;
  
  IF column_exists THEN
    ALTER TABLE users ALTER COLUMN role SET NOT NULL;
  END IF;
  
  -- Add CHECK constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Update full_name from username for existing users where full_name is null
UPDATE users SET full_name = username WHERE full_name IS NULL;

-- Make full_name NOT NULL after populating it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public'
             AND table_name = 'users' 
             AND column_name = 'full_name' 
             AND is_nullable = 'YES') THEN
    ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- CATEGORIES TABLE ENHANCEMENTS
-- ============================================================================

-- Add slug column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public'
                 AND table_name = 'categories' 
                 AND column_name = 'slug') THEN
    ALTER TABLE categories ADD COLUMN slug TEXT;
  END IF;
END $$;

-- Generate unique slugs for categories
DO $$
DECLARE
  cat RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER;
BEGIN
  FOR cat IN SELECT id, name FROM categories WHERE slug IS NULL
  LOOP
    -- Generate base slug from name
    base_slug := LOWER(REGEXP_REPLACE(cat.name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Remove leading/trailing dashes
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Ensure slug is not empty
    IF base_slug = '' THEN
      base_slug := 'category';
    END IF;
    
    final_slug := base_slug;
    counter := 1;
    
    -- Check if slug exists and add counter if needed
    WHILE EXISTS (SELECT 1 FROM categories WHERE slug = final_slug AND id != cat.id)
    LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update the category with unique slug
    UPDATE categories SET slug = final_slug WHERE id = cat.id;
  END LOOP;
END $$;

-- Make slug NOT NULL
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public'
             AND table_name = 'categories' 
             AND column_name = 'slug' 
             AND is_nullable = 'YES') THEN
    ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
  END IF;
END $$;

-- Add unique constraint on slug if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_key') THEN
    ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Add parent_id column for category hierarchy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public'
                 AND table_name = 'categories' 
                 AND column_name = 'parent_id') THEN
    ALTER TABLE categories ADD COLUMN parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public'
                 AND table_name = 'categories' 
                 AND column_name = 'description') THEN
    ALTER TABLE categories ADD COLUMN description TEXT;
  END IF;
END $$;

-- Rename icon to image_url if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public'
             AND table_name = 'categories' 
             AND column_name = 'icon') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'public'
                     AND table_name = 'categories' 
                     AND column_name = 'image_url') THEN
    ALTER TABLE categories RENAME COLUMN icon TO image_url;
  END IF;
END $$;

-- Add listing_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public'
                 AND table_name = 'categories' 
                 AND column_name = 'listing_count') THEN
    ALTER TABLE categories ADD COLUMN listing_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Calculate initial listing counts for existing categories
UPDATE categories 
SET listing_count = (
  SELECT COUNT(*) 
  FROM listings 
  WHERE listings.category_id = categories.id 
    AND listings.is_active = true
);

-- ============================================================================
-- LISTINGS TABLE ENHANCEMENTS FOR MULTI-IMAGE SUPPORT
-- ============================================================================

-- Add images array column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public'
                 AND table_name = 'listings' 
                 AND column_name = 'images') THEN
    ALTER TABLE listings ADD COLUMN images TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Migrate existing thumbnail_url to images array for existing listings
UPDATE listings 
SET images = ARRAY[thumbnail_url]
WHERE thumbnail_url IS NOT NULL 
  AND (images IS NULL OR array_length(images, 1) IS NULL);

-- Add primary_image_index column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public'
                 AND table_name = 'listings' 
                 AND column_name = 'primary_image_index') THEN
    ALTER TABLE listings ADD COLUMN primary_image_index INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add status column with all operations
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if status column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'listings' 
    AND column_name = 'status'
  ) INTO column_exists;
  
  -- Add column if it doesn't exist
  IF NOT column_exists THEN
    ALTER TABLE listings ADD COLUMN status TEXT DEFAULT 'approved';
  END IF;
  
  -- Now update nulls (column is guaranteed to exist)
  UPDATE listings SET status = 'approved' WHERE status IS NULL;
  
  -- Make status NOT NULL if it isn't already
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'listings' 
    AND column_name = 'status' 
    AND is_nullable = 'YES'
  ) INTO column_exists;
  
  IF column_exists THEN
    ALTER TABLE listings ALTER COLUMN status SET NOT NULL;
  END IF;
  
  -- Add CHECK constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'listings_status_check') THEN
    ALTER TABLE listings ADD CONSTRAINT listings_status_check CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Add rejection_reason column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public'
                 AND table_name = 'listings' 
                 AND column_name = 'rejection_reason') THEN
    ALTER TABLE listings ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- Add is_featured column if it doesn't exist (separate from is_boosted)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public'
                 AND table_name = 'listings' 
                 AND column_name = 'is_featured') THEN
    ALTER TABLE listings ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add constraints for multi-image validation
DO $$
BEGIN
  -- Drop existing constraints if they exist to avoid conflicts
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_images_count') THEN
    ALTER TABLE listings DROP CONSTRAINT valid_images_count;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_primary_image') THEN
    ALTER TABLE listings DROP CONSTRAINT valid_primary_image;
  END IF;
  
  -- Add new constraints
  ALTER TABLE listings ADD CONSTRAINT valid_images_count 
    CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) BETWEEN 1 AND 5);
  
  ALTER TABLE listings ADD CONSTRAINT valid_primary_image 
    CHECK (
      primary_image_index >= 0 
      AND (
        array_length(images, 1) IS NULL 
        OR primary_image_index < array_length(images, 1)
      )
    );
END $$;

-- ============================================================================
-- VENDOR APPLICATIONS TABLE
-- ============================================================================

-- Create vendor_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS vendor_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_description TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vendor applications
CREATE INDEX IF NOT EXISTS idx_vendor_applications_user_id ON vendor_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_applications_status ON vendor_applications(status);

-- ============================================================================
-- APPROVED VENDORS TABLE
-- ============================================================================

-- Create approved_vendors table if it doesn't exist
CREATE TABLE IF NOT EXISTS approved_vendors (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  approved_badge_enabled BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Listings indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured, created_at DESC) 
  WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_category_status ON listings(category_id, status);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================================================
-- TRIGGER FUNCTION FOR AUTOMATIC LISTING COUNT UPDATES
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_update_category_listing_count ON listings;
DROP FUNCTION IF EXISTS update_category_listing_count();

-- Create function to update category listing count
CREATE OR REPLACE FUNCTION update_category_listing_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT of approved listing
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE categories 
    SET listing_count = listing_count + 1 
    WHERE id = NEW.category_id;
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE of listing status
  IF TG_OP = 'UPDATE' THEN
    -- Changed from non-approved to approved
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
      UPDATE categories 
      SET listing_count = listing_count + 1 
      WHERE id = NEW.category_id;
    -- Changed from approved to non-approved
    ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
      UPDATE categories 
      SET listing_count = GREATEST(0, listing_count - 1) 
      WHERE id = NEW.category_id;
    END IF;
    
    -- Handle category change for approved listings
    IF OLD.category_id != NEW.category_id AND NEW.status = 'approved' THEN
      -- Decrement old category
      UPDATE categories 
      SET listing_count = GREATEST(0, listing_count - 1) 
      WHERE id = OLD.category_id;
      -- Increment new category
      UPDATE categories 
      SET listing_count = listing_count + 1 
      WHERE id = NEW.category_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE of approved listing
  IF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE categories 
    SET listing_count = GREATEST(0, listing_count - 1) 
    WHERE id = OLD.category_id;
    RETURN OLD;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_category_listing_count
  AFTER INSERT OR UPDATE OR DELETE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_category_listing_count();

-- ============================================================================
-- UPDATE TIMESTAMP TRIGGERS
-- ============================================================================

-- Create or replace function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers for tables with updated_at column
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_applications_updated_at ON vendor_applications;
CREATE TRIGGER update_vendor_applications_updated_at
  BEFORE UPDATE ON vendor_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VALIDATION COMMENTS
-- ============================================================================

COMMENT ON COLUMN listings.images IS 'Array of 1-5 image URLs for listing gallery';
COMMENT ON COLUMN listings.primary_image_index IS 'Index of primary image in images array (0-based)';
COMMENT ON COLUMN listings.status IS 'Listing approval status: pending, approved, or rejected';
COMMENT ON COLUMN listings.rejection_reason IS 'Reason for rejection if status is rejected';
COMMENT ON COLUMN categories.listing_count IS 'Cached count of approved listings in this category';
COMMENT ON COLUMN categories.slug IS 'URL-friendly category identifier';
COMMENT ON COLUMN categories.parent_id IS 'Parent category for hierarchy support';
COMMENT ON COLUMN users.role IS 'User role: user or admin';
COMMENT ON COLUMN users.full_name IS 'Full display name of the user';

COMMENT ON TABLE vendor_applications IS 'Vendor approval applications';
COMMENT ON TABLE approved_vendors IS 'Approved vendors with badge eligibility';

COMMENT ON CONSTRAINT valid_images_count ON listings IS 'Ensures 1-5 images per listing';
COMMENT ON CONSTRAINT valid_primary_image ON listings IS 'Ensures primary_image_index is within bounds';