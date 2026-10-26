-- Migration: Fix categories icon and image_url columns
-- 
-- Problem: Migration 050 renamed 'icon' column to 'image_url', causing icon names 
-- like "Home" to be treated as image URLs, breaking next/image components.
--
-- Solution: Restore both columns separately:
-- - icon: TEXT - stores icon name or emoji (e.g., "Home", "🏠")
-- - image_url: TEXT - stores actual image URLs (e.g., "https://...")
--
-- This migration:
-- 1. Adds 'icon' column if it doesn't exist
-- 2. Copies non-URL values from image_url to icon
-- 3. Replaces non-URL image_url values with placeholder URLs

BEGIN;

-- Add icon column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'categories' 
                 AND column_name = 'icon') THEN
    ALTER TABLE categories ADD COLUMN icon TEXT;
    
    -- Copy values from image_url to icon if they don't look like URLs
    UPDATE categories 
    SET icon = image_url 
    WHERE image_url IS NOT NULL 
      AND image_url NOT LIKE 'http://%' 
      AND image_url NOT LIKE 'https://%';
    
    -- Drop NOT NULL constraint on image_url if it exists
    ALTER TABLE categories ALTER COLUMN image_url DROP NOT NULL;
    
    -- Set image_url to NULL for non-URL values
    UPDATE categories 
    SET image_url = NULL 
    WHERE image_url IS NOT NULL 
      AND image_url NOT LIKE 'http://%' 
      AND image_url NOT LIKE 'https://%';
      
    RAISE NOTICE 'Added icon column and migrated non-URL values from image_url';
  END IF;
END $$;

COMMIT;
