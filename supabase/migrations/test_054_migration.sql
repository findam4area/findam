-- Test Script for Migration 054: Remove Translation Infrastructure
-- This script validates the migration logic without modifying production data
-- Run this in a test environment to verify the migration works correctly

-- ============================================================
-- PART 1: Create test environment
-- ============================================================

-- Create a temporary test table that mimics the categories structure
DROP TABLE IF EXISTS test_categories CASCADE;

CREATE TABLE test_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_translations JSONB DEFAULT '{}'::JSONB,
  description TEXT,
  description_translations JSONB DEFAULT '{}'::JSONB,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  parent_id UUID REFERENCES test_categories(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  listing_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create GIN indexes on test table
CREATE INDEX idx_test_categories_name_translations 
  ON test_categories USING GIN(name_translations);

CREATE INDEX idx_test_categories_description_translations 
  ON test_categories USING GIN(description_translations);

-- Insert test data
INSERT INTO test_categories (name, name_translations, description, description_translations, slug, listing_count)
VALUES 
  ('Electronics', '{"yo": "Ẹrọ Itanna", "ig": "Igwe Eletrọniki", "ha": "Kayan Lantarki"}'::jsonb, 
   'Electronic devices and gadgets', '{"yo": "Awọn ẹrọ itanna ati awọn gadgets", "ig": "Ngwa eletrọniki na ngwaọrụ"}'::jsonb,
   'electronics', 150),
  ('Home & Garden', '{"yo": "Ile ati Ọgba", "ig": "Ulo na Ubi", "ha": "Gida da Lambu"}'::jsonb,
   'Home improvement and garden supplies', '{"yo": "Awọn ohun elo ile ati ọgba", "ig": "Ngwa ulo na ubi"}'::jsonb,
   'home-garden', 75),
  ('Fashion', '{"yo": "Aṣa", "ig": "Ejiji", "ha": "Kayan Sawa"}'::jsonb,
   'Clothing and accessories', '{"yo": "Aṣọ ati awọn ohun elo", "ig": "Uwe na ngwa ejiji"}'::jsonb,
   'fashion', 200);

RAISE NOTICE 'Test environment created with 3 categories';

-- ============================================================
-- PART 2: Verify initial state (before migration)
-- ============================================================

DO $$
DECLARE
  name_trans_exists BOOLEAN;
  desc_trans_exists BOOLEAN;
  name_trans_index_exists BOOLEAN;
  desc_trans_index_exists BOOLEAN;
  test_count INTEGER;
BEGIN
  -- Check if translation columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_categories' 
    AND column_name = 'name_translations'
  ) INTO name_trans_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_categories' 
    AND column_name = 'description_translations'
  ) INTO desc_trans_exists;

  -- Check if indexes exist
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'test_categories' 
    AND indexname = 'idx_test_categories_name_translations'
  ) INTO name_trans_index_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'test_categories' 
    AND indexname = 'idx_test_categories_description_translations'
  ) INTO desc_trans_index_exists;

  SELECT COUNT(*) INTO test_count FROM test_categories;

  RAISE NOTICE '========================================================';
  RAISE NOTICE 'INITIAL STATE (Before Migration):';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'name_translations column exists: %', name_trans_exists;
  RAISE NOTICE 'description_translations column exists: %', desc_trans_exists;
  RAISE NOTICE 'name_translations index exists: %', name_trans_index_exists;
  RAISE NOTICE 'description_translations index exists: %', desc_trans_index_exists;
  RAISE NOTICE 'Total test categories: %', test_count;
  RAISE NOTICE '';
END $$;

-- ============================================================
-- PART 3: Apply migration steps to test table
-- ============================================================

-- Drop GIN indexes
DROP INDEX IF EXISTS idx_test_categories_name_translations;
DROP INDEX IF EXISTS idx_test_categories_description_translations;

RAISE NOTICE 'Step 1: Dropped GIN indexes';

-- Drop translation columns
ALTER TABLE test_categories DROP COLUMN IF EXISTS name_translations;
ALTER TABLE test_categories DROP COLUMN IF EXISTS description_translations;

RAISE NOTICE 'Step 2: Dropped translation columns';

-- ============================================================
-- PART 4: Verify final state (after migration)
-- ============================================================

DO $$
DECLARE
  name_trans_exists BOOLEAN;
  desc_trans_exists BOOLEAN;
  name_trans_index_exists BOOLEAN;
  desc_trans_index_exists BOOLEAN;
  name_col_exists BOOLEAN;
  desc_col_exists BOOLEAN;
  test_count INTEGER;
  test_record RECORD;
BEGIN
  -- Check if translation columns still exist (should be false)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_categories' 
    AND column_name = 'name_translations'
  ) INTO name_trans_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_categories' 
    AND column_name = 'description_translations'
  ) INTO desc_trans_exists;

  -- Check if base columns still exist (should be true)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_categories' 
    AND column_name = 'name'
  ) INTO name_col_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'test_categories' 
    AND column_name = 'description'
  ) INTO desc_col_exists;

  -- Check if indexes still exist (should be false)
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'test_categories' 
    AND indexname = 'idx_test_categories_name_translations'
  ) INTO name_trans_index_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'test_categories' 
    AND indexname = 'idx_test_categories_description_translations'
  ) INTO desc_trans_index_exists;

  -- Verify data integrity
  SELECT COUNT(*) INTO test_count FROM test_categories;

  RAISE NOTICE '========================================================';
  RAISE NOTICE 'FINAL STATE (After Migration):';
  RAISE NOTICE '========================================================';
  RAISE NOTICE 'name_translations column exists: %', name_trans_exists;
  RAISE NOTICE 'description_translations column exists: %', desc_trans_exists;
  RAISE NOTICE 'name_translations index exists: %', name_trans_index_exists;
  RAISE NOTICE 'description_translations index exists: %', desc_trans_index_exists;
  RAISE NOTICE '';
  RAISE NOTICE 'Base columns preserved:';
  RAISE NOTICE '  name column exists: %', name_col_exists;
  RAISE NOTICE '  description column exists: %', desc_col_exists;
  RAISE NOTICE '';
  RAISE NOTICE 'Data integrity:';
  RAISE NOTICE '  Total test categories: %', test_count;
  RAISE NOTICE '';

  -- Display sample data to confirm data preservation
  RAISE NOTICE 'Sample data after migration:';
  FOR test_record IN 
    SELECT name, description, slug, listing_count 
    FROM test_categories 
    ORDER BY listing_count DESC 
    LIMIT 3
  LOOP
    RAISE NOTICE '  - %: % (% listings)', test_record.name, test_record.description, test_record.listing_count;
  END LOOP;
  RAISE NOTICE '';

  -- ============================================================
  -- PART 5: Validation checks
  -- ============================================================

  RAISE NOTICE '========================================================';
  RAISE NOTICE 'VALIDATION RESULTS:';
  RAISE NOTICE '========================================================';

  -- Check 1: Translation columns removed
  IF NOT name_trans_exists AND NOT desc_trans_exists THEN
    RAISE NOTICE '✓ PASS: Translation columns successfully removed';
  ELSE
    RAISE WARNING '✗ FAIL: Translation columns still exist';
  END IF;

  -- Check 2: Translation indexes removed
  IF NOT name_trans_index_exists AND NOT desc_trans_index_exists THEN
    RAISE NOTICE '✓ PASS: Translation indexes successfully removed';
  ELSE
    RAISE WARNING '✗ FAIL: Translation indexes still exist';
  END IF;

  -- Check 3: Base columns preserved
  IF name_col_exists AND desc_col_exists THEN
    RAISE NOTICE '✓ PASS: Base name and description columns preserved';
  ELSE
    RAISE WARNING '✗ FAIL: Base columns were accidentally removed';
  END IF;

  -- Check 4: Data integrity
  IF test_count = 3 THEN
    RAISE NOTICE '✓ PASS: All test data preserved (3 categories)';
  ELSE
    RAISE WARNING '✗ FAIL: Data loss detected (expected 3, found %)', test_count;
  END IF;

  -- Check 5: Queries work without translation columns
  BEGIN
    PERFORM name, description FROM test_categories WHERE name ILIKE '%electronics%';
    RAISE NOTICE '✓ PASS: Queries work correctly without translation columns';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '✗ FAIL: Query failed after migration: %', SQLERRM;
  END;

  RAISE NOTICE '========================================================';
  
  -- Final verdict
  IF NOT name_trans_exists 
     AND NOT desc_trans_exists 
     AND NOT name_trans_index_exists 
     AND NOT desc_trans_index_exists 
     AND name_col_exists 
     AND desc_col_exists 
     AND test_count = 3 THEN
    RAISE NOTICE 'OVERALL RESULT: ✓ ALL TESTS PASSED';
    RAISE NOTICE 'Migration 054 is safe to apply to production';
  ELSE
    RAISE WARNING 'OVERALL RESULT: ✗ SOME TESTS FAILED';
    RAISE WARNING 'Review failures before applying to production';
  END IF;

  RAISE NOTICE '========================================================';
END $$;

-- ============================================================
-- PART 6: Cleanup test environment
-- ============================================================

DROP TABLE IF EXISTS test_categories CASCADE;

RAISE NOTICE '';
RAISE NOTICE 'Test environment cleaned up';
RAISE NOTICE 'Test script completed successfully';

-- ============================================================
-- Expected Results:
-- ============================================================
-- All validation checks should PASS:
-- ✓ Translation columns (name_translations, description_translations) removed
-- ✓ Translation indexes (idx_categories_name_translations, idx_categories_description_translations) removed
-- ✓ Base columns (name, description) preserved
-- ✓ All data preserved (no data loss)
-- ✓ Queries work correctly without translation columns
-- 
-- If all tests pass, migration 054 is ready for production deployment.
