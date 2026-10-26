-- Migration: Enhanced Categories Table with Multi-Language Support
-- This migration enhances the categories table with hierarchical structure and translation support
-- Requirements: 1.1, 1.2, 1.3, 1.5, 21.1, 21.2, 21.3
--
-- Migration Strategy:
-- 1. Backup existing category data
-- 2. Add new columns to categories table
-- 3. Migrate subcategories into categories with parent_id references
-- 4. Create indexes and triggers
-- 5. Drop old subcategories table

-- Step 1: Create trigger function for automatic updated_at timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Add new columns to existing categories table
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS name_translations JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS description_translations JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 3: Update display_order to NOT NULL with default if it isn't already
ALTER TABLE categories 
  ALTER COLUMN display_order SET DEFAULT 0,
  ALTER COLUMN display_order SET NOT NULL;

-- Step 4: Migrate subcategories into categories table as children
INSERT INTO categories (id, name, name_translations, icon, parent_id, display_order, is_hidden, created_at, updated_at)
SELECT 
  s.id,
  s.name,
  '{}'::JSONB as name_translations,
  COALESCE(c.icon, 'folder') as icon, -- Use parent icon or default
  s.category_id as parent_id,
  s.display_order,
  FALSE as is_hidden,
  s.created_at,
  NOW() as updated_at
FROM subcategories s
JOIN categories c ON s.category_id = c.id
ON CONFLICT (id) DO NOTHING;

-- Step 5: Drop the old unique constraint on name if it exists and add new composite unique constraint
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_name_per_level') THEN
    ALTER TABLE categories ADD CONSTRAINT unique_name_per_level UNIQUE(name, parent_id);
  END IF;
END $$;

-- Step 6: Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_name_translations ON categories USING GIN(name_translations);

-- Step 7: Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Update foreign key references from subcategories to categories
-- Update listings table subcategory_id references to point to the migrated categories
-- Note: This assumes subcategory_id should now reference the categories table
-- If the application logic needs to change, this should be reviewed

-- Step 9: Drop the old subcategories table
-- WARNING: This is a destructive operation. Ensure all data is migrated and application code is updated
-- Uncomment the following line when ready to drop the old table:
-- DROP TABLE IF EXISTS subcategories CASCADE;

-- Step 10: Add table and column comments for documentation
COMMENT ON TABLE categories IS 'Hierarchical category taxonomy with multi-language support for English, Yoruba, Igbo, and Hausa';
COMMENT ON COLUMN categories.name_translations IS 'JSONB object with language codes as keys: {"yo": "Yoruba", "ig": "Igbo", "ha": "Hausa"}';
COMMENT ON COLUMN categories.description_translations IS 'JSONB object with language codes as keys for category descriptions';
COMMENT ON COLUMN categories.parent_id IS 'NULL for main categories, references parent category for subcategories';
COMMENT ON COLUMN categories.display_order IS 'Determines the display order within the same hierarchy level';
COMMENT ON COLUMN categories.is_hidden IS 'Hidden categories are not displayed in the UI but preserve data integrity';
