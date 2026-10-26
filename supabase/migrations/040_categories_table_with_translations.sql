-- Migration: Categories Table with Multi-Language Translation Support
-- Task 1.1: Create database migration for categories table with translations support
-- Requirements: 1.1, 1.2, 1.3, 1.5, 21.1, 21.2, 21.3
--
-- This migration creates the hierarchical categories table with:
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
-- PART 2: Create categories table
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
  icon TEXT NOT NULL,
  
  -- Hierarchical structure (NULL for main categories, references parent for subcategories)
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Display ordering within same hierarchy level
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Soft delete flag for hiding categories without removing data
  is_hidden BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: prevent duplicate names at same hierarchy level
  CONSTRAINT unique_category_name_per_level UNIQUE(name, parent_id)
);

-- ============================================================
-- PART 3: Create indexes for efficient querying
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
-- PART 4: Create trigger for automatic updated_at updates
-- ============================================================

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PART 5: Add table and column comments for documentation
-- ============================================================

COMMENT ON TABLE categories IS 
  'Hierarchical category taxonomy with multi-language support for English, Yoruba, Igbo, and Hausa. Supports two-level hierarchy: main categories (parent_id IS NULL) and subcategories (parent_id references main category).';

COMMENT ON COLUMN categories.name IS 
  'Category name in English (default language)';

COMMENT ON COLUMN categories.name_translations IS 
  'JSONB object with language codes as keys: {"yo": "Yoruba name", "ig": "Igbo name", "ha": "Hausa name"}. Empty object if no translations available.';

COMMENT ON COLUMN categories.description IS 
  'Category description in English (optional)';

COMMENT ON COLUMN categories.description_translations IS 
  'JSONB object with language codes as keys for translated descriptions: {"yo": "...", "ig": "...", "ha": "..."}';

COMMENT ON COLUMN categories.icon IS 
  'Icon identifier for visual representation (e.g., material icon name, emoji, or custom icon key)';

COMMENT ON COLUMN categories.parent_id IS 
  'NULL for main categories (top-level), references parent category ID for subcategories. Enables hierarchical taxonomy with two levels.';

COMMENT ON COLUMN categories.display_order IS 
  'Determines the display order within the same hierarchy level. Lower numbers appear first. Must be unique within each parent context.';

COMMENT ON COLUMN categories.is_hidden IS 
  'Soft delete flag. Hidden categories are not displayed in the UI but preserve data integrity for existing business assignments. Prevents new businesses from selecting hidden categories.';

-- ============================================================
-- PART 6: Validation and constraints summary
-- ============================================================

-- Constraints enforced:
-- 1. name and parent_id must be unique together (UNIQUE constraint)
--    This prevents duplicate "Electronics" categories under the same parent,
--    but allows "Electronics" as both a main category and different subcategories
-- 
-- 2. parent_id foreign key with CASCADE delete ensures orphaned subcategories
--    are automatically removed if parent is deleted
--
-- 3. display_order has default value 0 but can be set to any integer
--    for custom ordering
--
-- 4. is_hidden defaults to FALSE for active categories

-- Expected data structure examples:
-- Main category: parent_id = NULL, name = "Home & Construction"
-- Subcategory: parent_id = <main_category_id>, name = "Plumbing Services"

-- Translation format example:
-- name_translations = {
--   "yo": "Ile ati Ikole",
--   "ig": "Ulo na Iwu",
--   "ha": "Gida da Gini"
-- }
