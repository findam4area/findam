# Database Migration Sync - Migration 050

## Overview
This migration (`050_sync_with_dashboard.sql`) brings local development databases into sync with the production database that has been manually updated via the Supabase dashboard.

## What This Migration Does

### Categories Table
- ✅ Adds `image_url` (renamed from `icon`)
- ✅ Adds `slug` for SEO-friendly URLs
- ✅ Adds `accent_color` for UI theming
- ✅ Adds `item_count` for tracking items
- ✅ Adds `listing_count` for tracking active listings
- ✅ Creates index on `slug`

### Listings Table
- ✅ Adds `images[]` array for multi-image support (1-5 images)
- ✅ Adds `primary_image_index` to mark the main image
- ✅ Adds `is_featured` for featured/promoted listings
- ✅ Adds `location_state` and `location_city` (supplements `state`/`lga`)
- ✅ Adds `rejection_reason` for admin moderation
- ✅ Updates `status` column type to VARCHAR with 'active' default
- ✅ Migrates existing location data to new columns
- ✅ Creates indexes for performance
- ✅ Adds multi-image validation constraints

### Users Table
- ✅ Adds `full_name` (populated from username)
- ✅ Adds `role` with 'user'/'admin' constraint
- ✅ Sets proper defaults and NOT NULL constraints

### Triggers & Functions
- ✅ Creates/updates `update_category_listing_count()` function
- ✅ Auto-updates `listing_count` and `item_count` when listings change
- ✅ Initializes counts for all existing categories

## Key Features

### Idempotent Design
This migration can be run multiple times safely:
- Checks if columns/constraints exist before adding
- Only modifies what's missing
- Preserves existing data

### Data Migration
- Automatically populates `full_name` from `username`
- Migrates `state` → `location_state`, `lga` → `location_city`
- Initializes category counts from existing listings

### Production Schema Match
The migration creates a schema that exactly matches the production database as of the schema export date, ensuring consistency across environments.

## Running the Migration

### First Time Setup
```bash
# Apply the migration
npx supabase db push

# Or if using remote database
npx supabase db remote commit
```

### Existing Databases
If your local database already has some of these changes, the migration will:
1. Skip columns that already exist
2. Only add missing columns
3. Update constraints as needed

## Notes for Developers

### Status Column Migration
- Production uses VARCHAR type with 'active' default
- Old migrations may have used TEXT with CHECK constraints
- This migration handles the conversion automatically

### Location Fields
- Keep using `state` and `lga` for now (NOT NULL)
- New `location_state` and `location_city` are optional supplements
- The trigger copies data between them

### Multi-Image Support
- Listings can now have 1-5 images in the `images[]` array
- `primary_image_index` (0-based) indicates which image is the main one
- Constraints ensure valid array bounds

### Category Counts
- `item_count`: Total items in category (legacy)
- `listing_count`: Active listings only (preferred)
- Auto-updated by trigger when listings change

## Troubleshooting

### "Column already exists" errors
✅ **Expected behavior** - the migration checks and skips existing columns

### "Constraint already exists" errors
The migration drops old constraints before recreating them. If you see this error, the migration is handling it properly.

### Status column type mismatch
If you have custom status values, review them before running this migration. Production expects: 'active', 'pending', 'approved', 'rejected', etc.

## Related Migrations

This migration supersedes/complements:
- `041_categories_table_complete.sql` - Category structure
- `042_business_profiles_complete.sql` - Business profiles
- `049_marketplace_enhancements_core_schema.sql` - Marketplace features
- `20240116_update_categories_for_marketplace.sql` - Category updates
- `20240116_update_listings_for_marketplace.sql` - Listings updates

## Production Schema Source

This migration is based on the actual production schema as exported from the Supabase dashboard. The schema reflects manual updates made directly to the production database.

---

**Last Updated:** January 2025
**Migration Version:** 050
**Status:** ✅ Ready for deployment