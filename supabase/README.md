# FindAm Supabase Database Setup

This directory contains all database migrations and configuration for the FindAm marketplace platform.

## Directory Structure

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql      # Core database tables and indexes
│   ├── 002_rls_policies.sql        # Row Level Security policies
│   ├── 003_storage_buckets.sql     # Storage buckets and policies
│   └── 004_seed_data.sql           # Initial seed data (categories, locations)
└── README.md
```

## Prerequisites

1. Install Supabase CLI:

   ```bash
   npm install -g supabase
   ```

2. Create a Supabase project at https://supabase.com

3. Link your local project to Supabase:
   ```bash
   supabase link --project-ref your-project-ref
   ```

## Running Migrations

### Option 1: Using Supabase CLI (Recommended)

1. Initialize Supabase in your project (if not already done):

   ```bash
   supabase init
   ```

2. Start local Supabase instance:

   ```bash
   supabase start
   ```

3. Apply migrations:
   ```bash
   supabase db push
   ```

### Option 2: Manual Execution via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Execute each migration file in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_storage_buckets.sql`
   - `004_seed_data.sql`

## Database Schema Overview

### Core Tables

- **users** - User accounts with verification status and trust scores
- **categories** - 11 main marketplace categories
- **subcategories** - Subcategories for each main category
- **listings** - Marketplace listings with media and location
- **listing_media** - Images and videos for listings
- **conversations** - Chat conversations between users
- **conversation_participants** - Users in each conversation
- **messages** - Chat messages with read receipts
- **stories** - 24-hour disappearing video stories
- **reviews** - User reviews and ratings
- **notifications** - Real-time notifications
- **payments** - Payment records for boosts and premium
- **reports** - User-reported content
- **user_likes** - Liked listings
- **user_saves** - Saved listings
- **portfolio_items** - Service provider portfolios
- **nigerian_states** - Nigerian states (8 major states)
- **nigerian_areas** - Areas within each state

### Storage Buckets

- **avatars** - User profile pictures (max 2MB)
- **listing-media** - Listing images and videos (max 50MB)
- **story-videos** - Story videos (max 20MB)
- **portfolio** - Portfolio items (max 10MB)

## Security

All tables have Row Level Security (RLS) enabled with policies that:

- Allow public read access to listings, categories, and profiles
- Restrict write access to authenticated users
- Ensure users can only modify their own data
- Protect private conversations and messages

## Seed Data

The migrations include seed data for:

- 11 main categories with icons
- 70+ subcategories across all categories
- 8 Nigerian states (7 major states + FCT)
- 100+ areas across all states

## Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Verification

After running migrations, verify the setup:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies;

-- Check storage buckets
SELECT * FROM storage.buckets;

-- Check seed data
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM subcategories;
SELECT COUNT(*) FROM nigerian_states;
SELECT COUNT(*) FROM nigerian_areas;
```

Expected counts:

- Categories: 11
- Subcategories: ~70
- States: 8
- Areas: ~100

## Troubleshooting

### Migration Errors

If you encounter errors:

1. Check migration order - they must run sequentially
2. Verify Supabase CLI is up to date: `supabase --version`
3. Check database logs in Supabase dashboard
4. Ensure you have proper permissions

### RLS Issues

If queries fail with permission errors:

1. Verify RLS policies are applied: `SELECT * FROM pg_policies;`
2. Check authentication is working
3. Test with service role key for debugging (not in production!)

### Storage Issues

If file uploads fail:

1. Verify buckets exist: `SELECT * FROM storage.buckets;`
2. Check bucket policies in Supabase dashboard
3. Verify file size limits and MIME types

## Next Steps

After setting up the database:

1. Generate TypeScript types:

   ```bash
   supabase gen types typescript --local > lib/supabase/database.types.ts
   ```

2. Set up Supabase client in your Next.js app
3. Implement authentication flows
4. Start building features according to the implementation plan

## Support

For issues or questions:

- Check Supabase documentation: https://supabase.com/docs
- Review the design document: `.kiro/specs/findam/design.md`
- Check the requirements: `.kiro/specs/findam/requirements.md`
