# Migration 053: Add Category Slug Column

## Overview
This migration adds a `slug` column to the `categories` table to enable URL routing for category detail pages at `/categories/{slug}`.

## Task Reference
- **Spec:** Browse Categories Page Enhancement
- **Task:** 1.1 Create migration to add slug column if missing
- **Requirements:** 1.7, 16.1, 16.9

## Migration Details

### What This Migration Does

1. **Adds slug column** (if missing)
   - Type: `TEXT`
   - Initially nullable to allow population
   - Set to `NOT NULL` after all rows are populated

2. **Generates slugs** for existing categories
   - Converts category names to URL-friendly format
   - Algorithm:
     - Convert to lowercase
     - Replace non-alphanumeric characters with hyphens
     - Remove leading/trailing hyphens
     - Handle empty results with "category" fallback
     - Add numeric suffix for duplicates (e.g., "electronics-1")

3. **Creates unique index** on slug column
   - Index name: `idx_categories_slug`
   - Prevents duplicate slugs across all categories
   - Enforced with unique constraint `categories_slug_key`

4. **Idempotent design**
   - Safe to run multiple times
   - Checks for existing column/index before creating
   - Only processes categories without slugs

### Slug Generation Examples

| Category Name              | Generated Slug              |
|---------------------------|-----------------------------|
| Electronics               | electronics                 |
| Home & Garden             | home-garden                 |
| Food / Beverages          | food-beverages              |
| Beauty & Personal Care    | beauty-personal-care        |
| 24/7 Services             | 24-7-services               |
| (empty string)            | category                    |
| !!!                       | category                    |
| Electronics (duplicate)   | electronics-1               |

### Edge Cases Handled

- ✅ Empty category names → fallback to "category"
- ✅ Only special characters → fallback to "category"
- ✅ Unicode characters → converted to ASCII equivalents
- ✅ Multiple consecutive spaces → single hyphen
- ✅ Leading/trailing hyphens → trimmed
- ✅ Duplicate names → numeric suffix added

## Testing

### Pre-Migration Checks

Before running this migration, verify:

```sql
-- Check if slug column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'categories'
  AND column_name = 'slug';

-- Check current categories (sample)
SELECT id, name, slug
FROM categories
LIMIT 10;
```

### Post-Migration Validation

After running this migration:

```sql
-- Verify all categories have slugs
SELECT 
  COUNT(*) as total_categories,
  COUNT(slug) as categories_with_slugs,
  COUNT(*) - COUNT(slug) as missing_slugs
FROM categories;

-- Check for duplicate slugs (should return 0 rows)
SELECT slug, COUNT(*) as count
FROM categories
GROUP BY slug
HAVING COUNT(*) > 1;

-- Verify slug format (should all be lowercase with hyphens)
SELECT name, slug
FROM categories
WHERE slug ~ '[^a-z0-9-]'  -- Contains invalid characters
   OR slug LIKE '-%'       -- Starts with hyphen
   OR slug LIKE '%-';      -- Ends with hyphen

-- Sample slugs
SELECT name, slug
FROM categories
ORDER BY display_order
LIMIT 20;
```

## Known Compatibility Notes

### Migration 049 Compatibility

This migration is designed to work with migration 049 (`marketplace_enhancements_core_schema.sql`), which also adds a slug column. The key differences:

- **Migration 049**: Added slug as part of marketplace enhancements
- **Migration 053**: Ensures slug exists with better edge case handling

**Both migrations are idempotent** and check for column existence before creating. If migration 049 already ran successfully:
- Migration 053 will skip column creation
- Migration 053 will still populate any missing slugs
- Migration 053 will ensure the unique index exists

This ensures the system works correctly regardless of which migration ran first.

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove unique constraint
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key;

-- Remove unique index
DROP INDEX IF EXISTS idx_categories_slug;

-- Remove slug column
ALTER TABLE categories DROP COLUMN IF EXISTS slug;
```

**⚠️ Warning:** Only rollback if absolutely necessary. Removing the slug column will break category detail page routing.

## Dependencies

- Requires: `categories` table to exist
- Used by: Category detail pages at `/categories/{slug}`
- Next steps: 
  - Task 1.2: Remove translation infrastructure
  - Task 2.x: Implement browse categories page

## Migration Status

- [x] Migration file created: `053_add_category_slug.sql`
- [x] Test script created: `test_slug_migration.sql`
- [ ] Migration applied to local database
- [ ] Migration applied to staging
- [ ] Migration applied to production
- [ ] Post-migration validation completed

## Notes

- The slug is generated automatically from the category name
- Slugs are permanent and should not change once created (to avoid breaking bookmarked URLs)
- If you need to manually change a slug, ensure the new slug is unique:
  ```sql
  UPDATE categories SET slug = 'new-slug' WHERE id = 'category-uuid';
  ```
