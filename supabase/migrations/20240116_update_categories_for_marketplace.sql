-- Migration: Update categories table for marketplace functionality
-- This migration updates the categories schema to support:
-- - URL-friendly slugs
-- - Category images
-- - Cached listing counts
-- - Accent colors for UI theming

BEGIN;

-- Add new columns
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS listing_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accent_color TEXT;

-- Generate unique slugs for existing categories that don't have them
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

-- Add unique constraint on slug
ALTER TABLE categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_update_category_listing_count ON listings;
DROP FUNCTION IF EXISTS update_category_listing_count();

-- Create a function to update listing counts
CREATE OR REPLACE FUNCTION update_category_listing_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the listing count for the affected category
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE categories
    SET listing_count = (
      SELECT COUNT(*)
      FROM listings
      WHERE category_id = NEW.category_id
        AND status = 'approved'
    )
    WHERE id = NEW.category_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE categories
    SET listing_count = (
      SELECT COUNT(*)
      FROM listings
      WHERE category_id = OLD.category_id
        AND status = 'approved'
    )
    WHERE id = OLD.category_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update listing counts
CREATE TRIGGER trigger_update_category_listing_count
  AFTER INSERT OR UPDATE OF category_id, status OR DELETE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_category_listing_count();

-- Initialize listing counts for all categories
UPDATE categories c
SET listing_count = (
  SELECT COUNT(*)
  FROM listings l
  WHERE l.category_id = c.id
    AND l.status = 'approved'
);

COMMIT;