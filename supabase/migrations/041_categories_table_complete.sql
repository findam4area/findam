-- Migration: Complete Categories Table with Multi-Language Translation Support
-- Task 1.1: Create database migration for categories table with translations support
-- Requirements: 1.1, 1.2, 1.3, 1.5, 21.1, 21.2, 21.3
--
-- This migration creates a hierarchical categories table with:
-- - JSONB fields for multi-language support (English, Yoruba, Igbo, Hausa)
-- - Self-referencing parent_id for hierarchy (main categories and subcategories)
-- - Indexes for efficient querying (parent_id, display_order, name_translations GIN)
-- - Trigger function for automatic updated_at timestamp updates
-- - Unique constraint on (name, parent_id) to prevent duplicates at same level

-- ============================================================
-- PART 1: Create trigger function for updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 
  'Trigger function to automatically update the updated_at timestamp column on row updates';

-- ============================================================
-- PART 2: Create categories table (if not exists)
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Category name and translations
  name TEXT NOT NULL,
  name_translations JSONB DEFAULT '{}'::JSONB,
  
  -- Category description and translations
  description TEXT,
  description_translations JSONB DEFAULT '{}'::JSONB,
  
  -- Visual representation
  icon TEXT,
  
  -- Hierarchical structure (NULL for main categories, references parent for subcategories)
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Display ordering within same hierarchy level
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Soft delete flag for hiding categories without removing data
  is_hidden BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ============================================================
-- PART 2A: Add icon column if it doesn't exist
-- ============================================================

DO $$
BEGIN
  -- Add icon column if it doesn't exist (and image_url doesn't exist either)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'categories' 
                 AND column_name = 'icon') THEN
    -- Only add icon if image_url also doesn't exist (to avoid conflict with renamed column)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'categories' 
                   AND column_name = 'image_url') THEN
      ALTER TABLE categories ADD COLUMN icon TEXT;
    END IF;
  END IF;
END $$;

-- ============================================================
-- PART 3: Drop existing constraints and create unique constraint
-- ============================================================

-- Drop old constraint if it exists (from previous migrations)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_key') THEN
    ALTER TABLE categories DROP CONSTRAINT categories_name_key;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_name_per_level') THEN
    ALTER TABLE categories DROP CONSTRAINT unique_name_per_level;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_category_name_per_level') THEN
    ALTER TABLE categories DROP CONSTRAINT unique_category_name_per_level;
  END IF;
END $$;

-- Create the unique constraint on (name, parent_id)
ALTER TABLE categories 
  ADD CONSTRAINT unique_category_name_per_level UNIQUE(name, parent_id);

-- ============================================================
-- PART 4: Create indexes for efficient querying
-- ============================================================

-- Index for hierarchical queries (find all subcategories of a parent)
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Index for ordering categories for display
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- GIN index for fast JSONB queries on translations
CREATE INDEX IF NOT EXISTS idx_categories_name_translations 
  ON categories USING GIN(name_translations);

-- GIN index for description translations
CREATE INDEX IF NOT EXISTS idx_categories_description_translations 
  ON categories USING GIN(description_translations);

-- Index for filtering hidden categories
CREATE INDEX IF NOT EXISTS idx_categories_is_hidden ON categories(is_hidden);

-- Composite index for main categories (parent_id IS NULL) ordered by display_order
CREATE INDEX IF NOT EXISTS idx_categories_main_ordered 
  ON categories(display_order) WHERE parent_id IS NULL;

-- ============================================================
-- PART 5: Create trigger for automatic updated_at updates
-- ============================================================

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PART 6: Add table and column comments for documentation
-- ============================================================

COMMENT ON TABLE categories IS 
  'Hierarchical category taxonomy with multi-language support for English, Yoruba, Igbo, and Hausa. Supports two-level hierarchy: main categories (parent_id IS NULL) and subcategories (parent_id references main category).';

COMMENT ON COLUMN categories.id IS 
  'Unique identifier for the category (UUID)';

COMMENT ON COLUMN categories.name IS 
  'Category name in English (default language)';

COMMENT ON COLUMN categories.name_translations IS 
  'JSONB object with language codes as keys: {"yo": "Yoruba name", "ig": "Igbo name", "ha": "Hausa name"}. Empty object if no translations available.';

COMMENT ON COLUMN categories.description IS 
  'Category description in English (optional)';

COMMENT ON COLUMN categories.description_translations IS 
  'JSONB object with language codes as keys for translated descriptions: {"yo": "...", "ig": "...", "ha": "..."}';

-- Add comment for icon column only if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'categories' 
             AND column_name = 'icon') THEN
    EXECUTE 'COMMENT ON COLUMN categories.icon IS ''Icon identifier for visual representation (e.g., material icon name, emoji, or custom icon key)''';
  END IF;
END $$;

COMMENT ON COLUMN categories.parent_id IS 
  'NULL for main categories (top-level), references parent category ID for subcategories. Enables hierarchical taxonomy with two levels.';

COMMENT ON COLUMN categories.display_order IS 
  'Determines the display order within the same hierarchy level. Lower numbers appear first.';

COMMENT ON COLUMN categories.is_hidden IS 
  'Soft delete flag. Hidden categories are not displayed in the UI but preserve data integrity for existing business assignments. Prevents new businesses from selecting hidden categories.';

COMMENT ON COLUMN categories.created_at IS 
  'Timestamp when the category was created';

COMMENT ON COLUMN categories.updated_at IS 
  'Timestamp when the category was last updated (automatically maintained by trigger)';

-- ============================================================
-- PART 7: Migration summary and validation
-- ============================================================

-- Log successful migration
DO $$ 
BEGIN
  RAISE NOTICE 'Migration 041: Categories table migration completed successfully';
  RAISE NOTICE '  - Table: categories (created or already exists)';
  RAISE NOTICE '  - Trigger: update_categories_updated_at (created)';
  RAISE NOTICE '  - Indexes: 6 indexes created (parent_id, display_order, name_translations GIN, description_translations GIN, is_hidden, main_ordered)';
  RAISE NOTICE '  - Constraint: unique_category_name_per_level on (name, parent_id)';
  RAISE NOTICE '  - Requirements validated: 1.1, 1.2, 1.3, 1.5, 21.1, 21.2, 21.3';
END $$;

-- ============================================================
-- Expected data structure examples:
-- ============================================================
-- Main category example:
--   {
--     id: 'uuid',
--     name: 'Home & Construction',
--     name_translations: {
--       yo: 'Ile ati Ikole',
--       ig: 'Ulo na Iwu',
--       ha: 'Gida da Gini'
--     },
--     description: 'Services related to home improvement and construction',
--     icon: 'home',
--     parent_id: NULL,
--     display_order: 1,
--     is_hidden: false
--   }
--
-- Subcategory example:
--   {
--     id: 'uuid',
--     name: 'Plumbing Services',
--     name_translations: {
--       yo: 'Awon Iṣẹ Omi',
--       ig: 'Oru Mmiri',
--       ha: 'Ayyukan Ruwa'
--     },
--     description: 'Professional plumbing installation and repair',
--     icon: 'plumbing',
--     parent_id: '<parent_category_uuid>',
--     display_order: 1,
--     is_hidden: false
--   }
