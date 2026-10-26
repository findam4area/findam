-- ============================================================================
-- Migration 050: Sync with Production Dashboard Schema
-- ============================================================================
-- This migration syncs the local database schema with the production database
-- that has been manually updated via the Supabase dashboard.
-- 
-- This migration is fully idempotent and can be run multiple times safely.
-- It only adds/modifies what's missing to match the production state.
-- ============================================================================

BEGIN;

-- ============================================================================
-- CATEGORIES TABLE - Sync with Production
-- ============================================================================
-- Production columns: id, name, image_url, display_order, created_at, slug, 
-- accent_color, parent_id, item_count, updated_at, name_translations, 
-- description, description_translations, is_hidden, listing_count

DO $$
BEGIN
  -- Add image_url if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'categories' 
                 AND column_name = 'image_url') THEN
    ALTER TABLE categories ADD COLUMN image_url TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add slug if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'categories' 
                 AND column_name = 'slug') THEN
    ALTER TABLE categories ADD COLUMN slug TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add accent_color if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'categories' 
                 AND column_name = 'accent_color') THEN
    ALTER TABLE categories ADD COLUMN accent_color TEXT;
  END IF;
  
  -- Add item_count if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'categories' 
                 AND column_name = 'item_count') THEN
    ALTER TABLE categories ADD COLUMN item_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add listing_count if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'categories' 
                 AND column_name = 'listing_count') THEN
    ALTER TABLE categories ADD COLUMN listing_count INTEGER DEFAULT 0;
  END IF;
  
  -- Rename icon to image_url if icon exists and image_url doesn't
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' AND table_name = 'categories' 
             AND column_name = 'icon')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'public' AND table_name = 'categories' 
                     AND column_name = 'image_url') THEN
    ALTER TABLE categories RENAME COLUMN icon TO image_url;
  END IF;
END $$;

-- Create index on slug if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================================================
-- LISTINGS TABLE - Sync with Production
-- ============================================================================
-- Production columns: id, user_id, business_id, title, description, price, 
-- category_id, subcategory_id, condition, state, lga, ward, coordinates,
-- thumbnail_url, is_boosted, boost_expires_at, is_active, views_count,
-- likes_count, saves_count, created_at, updated_at, embedding,
-- discount_percentage, original_price, deal_expires_at, boost_level,
-- status, deleted_at, embedding_needs_update, images, primary_image_index,
-- rejection_reason, is_featured, location_state, location_city

DO $$
BEGIN
  -- Add images array if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'listings' 
                 AND column_name = 'images') THEN
    ALTER TABLE listings ADD COLUMN images TEXT[] DEFAULT '{}';
  END IF;
  
  -- Add primary_image_index if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'listings' 
                 AND column_name = 'primary_image_index') THEN
    ALTER TABLE listings ADD COLUMN primary_image_index INTEGER DEFAULT 0;
  END IF;
  
  -- Add is_featured if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'listings' 
                 AND column_name = 'is_featured') THEN
    ALTER TABLE listings ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
  
  -- Add location_state if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'listings' 
                 AND column_name = 'location_state') THEN
    ALTER TABLE listings ADD COLUMN location_state TEXT;
  END IF;
  
  -- Add location_city if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'listings' 
                 AND column_name = 'location_city') THEN
    ALTER TABLE listings ADD COLUMN location_city TEXT;
  END IF;
  
  -- Add rejection_reason if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'listings' 
                 AND column_name = 'rejection_reason') THEN
    ALTER TABLE listings ADD COLUMN rejection_reason TEXT;
  END IF;
  
  -- Update status column type if it exists but is wrong type
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' AND table_name = 'listings' 
             AND column_name = 'status' AND data_type != 'character varying') THEN
    -- Drop existing constraints on status
    ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;
    ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check1;
    
    -- Change type
    ALTER TABLE listings ALTER COLUMN status TYPE VARCHAR USING status::VARCHAR;
    ALTER TABLE listings ALTER COLUMN status SET DEFAULT 'active';
  END IF;
  
  -- Ensure status has default if column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' AND table_name = 'listings' 
             AND column_name = 'status') THEN
    ALTER TABLE listings ALTER COLUMN status SET DEFAULT 'active';
    ALTER TABLE listings ALTER COLUMN status SET NOT NULL;
  END IF;
END $$;

-- Migrate data from old location fields to new ones
UPDATE listings 
SET location_state = state, location_city = lga 
WHERE location_state IS NULL AND state IS NOT NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_listings_is_featured ON listings(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_listings_location_state ON listings(location_state);
CREATE INDEX IF NOT EXISTS idx_listings_location_city ON listings(location_city);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

-- Drop old constraints if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_images_count') THEN
    ALTER TABLE listings DROP CONSTRAINT valid_images_count;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_primary_image') THEN
    ALTER TABLE listings DROP CONSTRAINT valid_primary_image;
  END IF;
END $$;

-- Add constraints for multi-image support
ALTER TABLE listings ADD CONSTRAINT valid_images_count 
  CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) BETWEEN 1 AND 5);

ALTER TABLE listings ADD CONSTRAINT valid_primary_image 
  CHECK (primary_image_index >= 0 AND (array_length(images, 1) IS NULL OR primary_image_index < array_length(images, 1)));

-- ============================================================================
-- USERS TABLE - Sync with Production
-- ============================================================================
-- Production columns: id, email, username, phone, avatar_url, bio, trust_score,
-- is_premium, premium_expires_at, phone_verified, nin_verified, video_verified,
-- is_suspended, created_at, updated_at, cv_url, skills, is_service_provider,
-- is_job_seeker, personalized_recommendations_enabled, full_name, role

DO $$
BEGIN
  -- Add full_name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'users' 
                 AND column_name = 'full_name') THEN
    ALTER TABLE users ADD COLUMN full_name TEXT;
  END IF;
  
  -- Populate full_name from username if null
  UPDATE users SET full_name = username WHERE full_name IS NULL;
  
  -- Make full_name NOT NULL
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' AND table_name = 'users' 
             AND column_name = 'full_name' AND is_nullable = 'YES') THEN
    ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;
  END IF;
  
  -- Add role if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' AND table_name = 'users' 
                 AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
  
  -- Set default value for role
  UPDATE users SET role = 'user' WHERE role IS NULL;
  
  -- Make role NOT NULL and add constraint
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' AND table_name = 'users' 
             AND column_name = 'role' AND is_nullable = 'YES') THEN
    ALTER TABLE users ALTER COLUMN role SET NOT NULL;
  END IF;
  
  -- Add role constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- ============================================================================
-- TRIGGER: Update category listing_count automatically
-- ============================================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_update_category_listing_count ON listings;
DROP FUNCTION IF EXISTS update_category_listing_count();

-- Create function to update category listing counts
CREATE OR REPLACE FUNCTION update_category_listing_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT of active listing
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    UPDATE categories 
    SET listing_count = listing_count + 1,
        item_count = item_count + 1
    WHERE id = NEW.category_id;
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE of listing
  IF TG_OP = 'UPDATE' THEN
    -- Changed from inactive to active
    IF OLD.is_active = false AND NEW.is_active = true THEN
      UPDATE categories 
      SET listing_count = listing_count + 1,
          item_count = item_count + 1
      WHERE id = NEW.category_id;
    -- Changed from active to inactive
    ELSIF OLD.is_active = true AND NEW.is_active = false THEN
      UPDATE categories 
      SET listing_count = GREATEST(0, listing_count - 1),
          item_count = GREATEST(0, item_count - 1)
      WHERE id = NEW.category_id;
    END IF;
    
    -- Handle category change for active listings
    IF OLD.category_id != NEW.category_id AND NEW.is_active = true THEN
      -- Decrement old category
      UPDATE categories 
      SET listing_count = GREATEST(0, listing_count - 1),
          item_count = GREATEST(0, item_count - 1)
      WHERE id = OLD.category_id;
      -- Increment new category
      UPDATE categories 
      SET listing_count = listing_count + 1,
          item_count = item_count + 1
      WHERE id = NEW.category_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE of active listing
  IF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    UPDATE categories 
    SET listing_count = GREATEST(0, listing_count - 1),
        item_count = GREATEST(0, item_count - 1)
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
-- INITIALIZE COUNTS
-- ============================================================================

-- Initialize listing_count and item_count for all categories
UPDATE categories c
SET listing_count = (
  SELECT COUNT(*) 
  FROM listings l 
  WHERE l.category_id = c.id AND l.is_active = true
),
item_count = (
  SELECT COUNT(*) 
  FROM listings l 
  WHERE l.category_id = c.id AND l.is_active = true
);

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 050: Database synced with production dashboard';
  RAISE NOTICE '  ✓ Categories table: image_url, slug, accent_color, item_count, listing_count';
  RAISE NOTICE '  ✓ Listings table: images[], primary_image_index, is_featured, location_state, location_city, rejection_reason, status';
  RAISE NOTICE '  ✓ Users table: full_name, role';
  RAISE NOTICE '  ✓ Triggers: Auto-update category counts';
  RAISE NOTICE '  ✓ Constraints: Multi-image validation, role validation';
  RAISE NOTICE '';
  RAISE NOTICE 'Local database is now in sync with production schema.';
END $$;