-- Migration: Add slug column to categories table if missing
-- Task 1.1: Create migration to add slug column if missing
-- Requirements: 1.7, 16.1, 16.9
-- 
-- This migration ensures the categories table has a slug column for URL routing.
-- The slug column is required for category detail pages at `/categories/{slug}`.
-- 
-- This migration is idempotent and safe to run multiple times:
-- - Checks if slug column exists before adding it
-- - Generates unique slugs from category names
-- - Adds unique index to prevent duplicate slugs
-- - Handles edge cases (empty names, special characters, conflicts)

-- ============================================================
-- PART 1: Add slug column if it doesn't exist
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'categories' 
    AND column_name = 'slug'
  ) THEN
    -- Add slug column as TEXT, nullable initially
    ALTER TABLE categories ADD COLUMN slug TEXT;
    
    RAISE NOTICE 'Added slug column to categories table';
  ELSE
    RAISE NOTICE 'Slug column already exists, skipping creation';
  END IF;
END $$;

-- ============================================================
-- PART 2: Generate slugs for categories that don't have them
-- ============================================================

DO $$
DECLARE
  cat RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER;
BEGIN
  -- Process only categories without slugs
  FOR cat IN 
    SELECT id, name 
    FROM categories 
    WHERE slug IS NULL OR slug = ''
  LOOP
    -- Generate base slug from name
    -- Convert to lowercase and replace non-alphanumeric characters with hyphens
    base_slug := LOWER(REGEXP_REPLACE(cat.name, '[^a-zA-Z0-9]+', '-', 'g'));
    
    -- Remove leading and trailing hyphens
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Handle edge case: empty slug after transformation
    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'category';
    END IF;
    
    -- Ensure slug uniqueness by adding counter if needed
    final_slug := base_slug;
    counter := 1;
    
    -- Check for conflicts and increment counter until unique slug found
    WHILE EXISTS (
      SELECT 1 
      FROM categories 
      WHERE slug = final_slug 
      AND id != cat.id
    ) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update the category with the unique slug
    UPDATE categories 
    SET slug = final_slug 
    WHERE id = cat.id;
    
    RAISE NOTICE 'Generated slug for category "%": %', cat.name, final_slug;
  END LOOP;
END $$;

-- ============================================================
-- PART 3: Make slug NOT NULL after populating all rows
-- ============================================================

DO $$
BEGIN
  -- Only set NOT NULL if column exists and all rows have values
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'categories' 
    AND column_name = 'slug'
    AND is_nullable = 'YES'
  ) THEN
    -- Verify all slugs are populated
    IF NOT EXISTS (SELECT 1 FROM categories WHERE slug IS NULL OR slug = '') THEN
      ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
      RAISE NOTICE 'Set slug column to NOT NULL';
    ELSE
      RAISE WARNING 'Cannot set slug to NOT NULL: some categories still have NULL slugs';
    END IF;
  ELSE
    RAISE NOTICE 'Slug column is already NOT NULL';
  END IF;
END $$;

-- ============================================================
-- PART 4: Add unique index on slug column
-- ============================================================

DO $$
BEGIN
  -- Drop constraint first if it exists (required before dropping index)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'categories_slug_key'
  ) THEN
    ALTER TABLE categories DROP CONSTRAINT categories_slug_key;
    RAISE NOTICE 'Dropped existing constraint categories_slug_key';
  END IF;

  -- Drop existing indexes if they exist (for idempotency)
  DROP INDEX IF EXISTS idx_categories_slug;
  DROP INDEX IF EXISTS categories_slug_key;

  -- Create unique index to prevent duplicate slugs
  CREATE UNIQUE INDEX idx_categories_slug ON categories(slug);
  
  RAISE NOTICE 'Created unique index on slug column';

  -- Add unique constraint using the index
  ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE USING INDEX idx_categories_slug;
  RAISE NOTICE 'Added unique constraint categories_slug_key';
END $$;

-- ============================================================
-- PART 5: Add column comment for documentation
-- ============================================================

COMMENT ON COLUMN categories.slug IS 
  'URL-friendly identifier for category routing. Generated from name by converting to lowercase and replacing non-alphanumeric characters with hyphens. Must be unique across all categories.';

-- ============================================================
-- PART 6: Migration summary and validation
-- ============================================================

DO $$ 
DECLARE
  total_categories INTEGER;
  categories_with_slugs INTEGER;
BEGIN
  -- Count categories
  SELECT COUNT(*) INTO total_categories FROM categories;
  SELECT COUNT(*) INTO categories_with_slugs FROM categories WHERE slug IS NOT NULL AND slug != '';
  
  -- Log migration summary
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Migration 053: Add category slug column';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Status: COMPLETED';
  RAISE NOTICE 'Total categories: %', total_categories;
  RAISE NOTICE 'Categories with slugs: %', categories_with_slugs;
  
  IF total_categories = categories_with_slugs THEN
    RAISE NOTICE 'All categories have unique slugs';
  ELSE
    RAISE WARNING 'Some categories are missing slugs: % categories', (total_categories - categories_with_slugs);
  END IF;
  
  RAISE NOTICE 'Requirements validated: 1.7, 16.1, 16.9';
  RAISE NOTICE '================================================';
END $$;

-- ============================================================
-- Expected slug generation examples:
-- ============================================================
-- Input: "Electronics"        -> Output: "electronics"
-- Input: "Home & Garden"      -> Output: "home-garden"
-- Input: "Food / Beverages"   -> Output: "food-beverages"
-- Input: "Beauty & Personal Care" -> Output: "beauty-personal-care"
-- Input: "24/7 Services"      -> Output: "24-7-services"
-- Input: ""                   -> Output: "category"
-- Input: "!!!"                -> Output: "category"
-- Duplicate handling: "electronics" already exists -> "electronics-1"
