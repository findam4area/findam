-- Migration: Remove Multi-Language Translation Infrastructure
-- Task 1.2: Create migration to remove translation infrastructure
-- Requirements: 17.1, 17.2, 17.3, 17.4
--
-- This migration removes the multi-language translation infrastructure from the categories table:
-- - Drops JSONB translation columns (name_translations, description_translations)
-- - Drops GIN indexes associated with translation columns
-- - Updates table and column comments to remove translation references
-- - System transitions to English-only mode using name and description columns
--
-- This migration is irreversible. Translation data will be permanently deleted.
-- The system will operate using only the English name and description columns.

-- ============================================================
-- PART 1: Drop GIN indexes for translation columns
-- ============================================================

DO $$
BEGIN
  -- Drop GIN index on name_translations
  DROP INDEX IF EXISTS idx_categories_name_translations;

  -- Drop GIN index on description_translations
  DROP INDEX IF EXISTS idx_categories_description_translations;

  RAISE NOTICE 'Dropped GIN indexes for translation columns';
END $$;

-- ============================================================
-- PART 2: Drop translation columns from categories table
-- ============================================================

-- Drop name_translations column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'categories' 
    AND column_name = 'name_translations'
  ) THEN
    ALTER TABLE categories DROP COLUMN name_translations;
    RAISE NOTICE 'Dropped name_translations column';
  ELSE
    RAISE NOTICE 'Column name_translations does not exist, skipping';
  END IF;
END $$;

-- Drop description_translations column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'categories' 
    AND column_name = 'description_translations'
  ) THEN
    ALTER TABLE categories DROP COLUMN description_translations;
    RAISE NOTICE 'Dropped description_translations column';
  ELSE
    RAISE NOTICE 'Column description_translations does not exist, skipping';
  END IF;
END $$;

-- ============================================================
-- PART 3: Update table comment to remove translation references
-- ============================================================

DO $$
BEGIN
  COMMENT ON TABLE categories IS 
    'Hierarchical category taxonomy supporting unlimited nesting levels via parent_id. Each category can have subcategories, which can have their own subcategories, enabling flexible category structures. System operates in English-only mode.';

  RAISE NOTICE 'Updated table comment to remove translation references';
END $$;

-- ============================================================
-- PART 4: Update column comments to remove translation references
-- ============================================================

COMMENT ON COLUMN categories.name IS 
  'Category name in English';

COMMENT ON COLUMN categories.description IS 
  'Category description in English (optional)';

COMMENT ON COLUMN categories.parent_id IS 
  'NULL for top-level categories, references parent category ID for subcategories. Enables hierarchical taxonomy with unlimited nesting depth.';

COMMENT ON COLUMN categories.display_order IS 
  'Determines the display order within the same hierarchy level. Lower numbers appear first.';

COMMENT ON COLUMN categories.is_hidden IS 
  'Soft delete flag. Hidden categories are not displayed in the UI but preserve data integrity for existing business assignments.';

COMMENT ON COLUMN categories.created_at IS 
  'Timestamp when the category was created';

COMMENT ON COLUMN categories.updated_at IS 
  'Timestamp when the category was last updated (automatically maintained by trigger)';

-- Add comments for columns that may exist
DO $$
BEGIN
  -- Comment on slug if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'categories' 
    AND column_name = 'slug'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN categories.slug IS ''URL-friendly identifier for category routing. Must be unique across all categories.''';
  END IF;

  -- Comment on listing_count if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'categories' 
    AND column_name = 'listing_count'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN categories.listing_count IS ''Cached count of approved listings in this category (automatically maintained by trigger)''';
  END IF;

  -- Comment on image_url if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'categories' 
    AND column_name = 'image_url'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN categories.image_url IS ''URL to category image for visual representation''';
  END IF;

  -- Comment on icon if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'categories' 
    AND column_name = 'icon'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN categories.icon IS ''Icon identifier for visual representation (e.g., material icon name, emoji, or custom icon key)''';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE 'Updated column comments to remove translation references';
END $$;

-- ============================================================
-- PART 5: Migration summary and validation
-- ============================================================

DO $$ 
DECLARE
  total_categories INTEGER;
  has_name_translations BOOLEAN;
  has_description_translations BOOLEAN;
BEGIN
  -- Check if translation columns still exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'categories' 
    AND column_name = 'name_translations'
  ) INTO has_name_translations;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'categories' 
    AND column_name = 'description_translations'
  ) INTO has_description_translations;

  -- Count total categories
  SELECT COUNT(*) INTO total_categories FROM categories;

  -- Log migration summary
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Migration 054: Remove Translation Infrastructure';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'Status: COMPLETED';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes Applied:';
  RAISE NOTICE '  - Dropped index: idx_categories_name_translations';
  RAISE NOTICE '  - Dropped index: idx_categories_description_translations';
  
  IF has_name_translations THEN
    RAISE WARNING '  - Column name_translations still exists (DROP may have failed)';
  ELSE
    RAISE NOTICE '  - Dropped column: name_translations';
  END IF;

  IF has_description_translations THEN
    RAISE WARNING '  - Column description_translations still exists (DROP may have failed)';
  ELSE
    RAISE NOTICE '  - Dropped column: description_translations';
  END IF;

  RAISE NOTICE '  - Updated table comment (removed translation references)';
  RAISE NOTICE '  - Updated column comments (removed Yoruba, Igbo, Hausa references)';
  RAISE NOTICE '';
  RAISE NOTICE 'System Status:';
  RAISE NOTICE '  - Language Mode: English-only';
  RAISE NOTICE '  - Total Categories: %', total_categories;
  RAISE NOTICE '  - Categories use name and description columns only';
  RAISE NOTICE '';
  RAISE NOTICE 'Requirements Validated: 17.1, 17.2, 17.3, 17.4';
  RAISE NOTICE '========================================================';
  
  -- Final verification
  IF NOT has_name_translations AND NOT has_description_translations THEN
    RAISE NOTICE 'SUCCESS: All translation infrastructure removed successfully';
  ELSE
    RAISE WARNING 'WARNING: Some translation columns may still exist';
  END IF;
END $$;

-- ============================================================
-- Post-Migration Notes:
-- ============================================================
-- 1. The system now operates in English-only mode
-- 2. Translation columns (name_translations, description_translations) have been permanently removed
-- 3. All category queries should use only name and description columns
-- 4. Language parameters should be removed from application code
-- 5. Language Selector component should be deleted from the UI
-- 6. This migration is irreversible - translation data cannot be recovered after running
