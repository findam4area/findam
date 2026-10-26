# Seed Data Generation Script

## Overview

The `seed-data.ts` script generates comprehensive test data for the FindAm marketplace platform. This script creates realistic Nigerian content including users, categories, listings, and vendor applications.

## What It Creates

### 1. Users (21 total)
- **1 Admin User**
  - Email: `admin@findam.ng`
  - Password: `Admin123`
  - Access to admin dashboard and approval workflows

- **20 Regular Users**
  - Realistic Nigerian names (e.g., Adebayo, Chidinma, Emeka)
  - Valid email addresses from common providers
  - Nigerian phone numbers with proper prefixes (0803, 0806, etc.)
  - Unique usernames based on email addresses

### 2. Categories (10 total)
- Services
- Products
- Opportunities
- Education
- Health
- Technology
- Fashion
- Food
- Real Estate
- Events

### 3. Listings (50 total)
- **Status Distribution:**
  - 10 Pending (awaiting admin approval)
  - 35 Approved (publicly visible)
  - 5 Rejected (with rejection reasons)

- **Image Support:**
  - Each listing has 3-5 images
  - Uses placeholder images with proper dimensions (800x600)
  - Primary image index is set (default: 0)

- **Location Data:**
  - Realistic Nigerian states (Lagos, Abuja, Kano, etc.)
  - Nigerian cities and LGAs
  - Distributed across different regions

- **Business Types:**
  - Varied business types per category
  - Realistic titles and descriptions
  - Price ranges (₦5,000 - ₦100,000 or null for services)

### 4. Vendor Applications (10 total)
- **Status Distribution:**
  - 3 Pending (awaiting admin review)
  - 5 Approved (with vendor badges enabled)
  - 2 Rejected (with rejection reasons)

- **Approved Vendors:**
  - 5 approved vendors with active badges
  - Records in `approved_vendors` table
  - Business names and contact information

## Usage

### Prerequisites

1. **Environment Variables:**
   Ensure your `.env.local` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Database Migrations:**
   All database migrations must be applied before running the seed script.

### Running the Script

```bash
# Navigate to project root
cd c:\Users\User\Documents\findam4area

# Run the seed script
npx tsx scripts/seed-data.ts
```

### Verification

To verify the seeded data:

```bash
npx tsx scripts/verify-seed.ts
```

This will display counts for:
- Users
- Listings
- Vendor Applications
- Categories

## Features

### Idempotent Execution
The script is designed to be run multiple times safely:
- Checks for existing data before seeding
- Skips existing records
- Updates existing records where appropriate
- Won't create duplicates

### Referential Integrity
The script maintains proper database relationships:
- Users are created in both `auth.users` and `users` tables
- Listings reference valid users and categories
- Vendor applications reference existing users
- Approved vendors link to their applications

### Realistic Nigerian Content

#### Names
Uses authentic Nigerian names from major ethnic groups:
- Yoruba: Adebayo, Folake, Oluwaseun, Titilayo
- Igbo: Chidinma, Emeka, Chiamaka, Chinedu
- Hausa: Aisha, Fatima, Ibrahim, Musa

#### Phone Numbers
Follows Nigerian mobile format with real prefixes:
- MTN: 0803, 0806, 0810, 0813, 0816
- Glo: 0805, 0807, 0811, 0815
- Airtel: 0802, 0808, 0812, 0902
- 9mobile: 0809, 0817, 0818, 0909

#### Locations
- Major Nigerian states: Lagos, Abuja, Kano, Rivers, Kaduna, etc.
- Popular cities: Lagos, Ikeja, Port Harcourt, Ibadan, Enugu, etc.
- Proper state/LGA combinations

#### Business Descriptions
Contextually appropriate descriptions for Nigerian market:
- Local service terminology
- Nigerian business practices
- Regional references

## Database Schema Compatibility

The script is compatible with the FindAm database schema:

### Users Table Fields
- `id` (UUID, from auth.users)
- `email` (TEXT, unique)
- `username` (TEXT, unique)
- `full_name` (TEXT)
- `phone` (TEXT)
- `avatar_url` (TEXT, nullable)
- `bio` (TEXT, nullable)

### Listings Table Fields
- `id` (UUID)
- `user_id` (UUID, foreign key)
- `title` (TEXT)
- `description` (TEXT)
- `price` (DECIMAL, nullable)
- `category_id` (UUID, foreign key)
- `state` (TEXT)
- `lga` (TEXT)
- `images` (TEXT[], array of 1-5 URLs)
- `primary_image_index` (INTEGER, 0-4)
- `status` (TEXT: pending/approved/rejected)
- `is_featured` (BOOLEAN)
- `rejection_reason` (TEXT, nullable)

### Vendor Applications Table Fields
- `id` (UUID)
- `user_id` (UUID, foreign key)
- `business_name` (TEXT)
- `business_description` (TEXT)
- `contact_email` (TEXT)
- `contact_phone` (TEXT)
- `status` (TEXT: pending/approved/rejected)
- `rejection_reason` (TEXT, nullable)

## Error Handling

The script includes comprehensive error handling:

1. **Missing Environment Variables:**
   - Validates Supabase credentials before execution
   - Exits with clear error message if missing

2. **Database Connection Errors:**
   - Logs errors but continues with remaining data
   - Provides summary of successes and failures

3. **Duplicate Entries:**
   - Detects and skips existing records
   - Reports skipped entries in summary

4. **Foreign Key Violations:**
   - Ensures parent records exist before creating children
   - Validates relationships before insertion

## Testing the Seeded Data

### Admin Login
1. Navigate to `/login`
2. Use credentials:
   - Email: `admin@findam.ng`
   - Password: `Admin123`
3. Access admin dashboard at `/admin`

### Review Pending Listings
1. Log in as admin
2. Go to `/admin/listings`
3. See 10 pending listings to approve/reject

### Review Vendor Applications
1. Log in as admin
2. Go to `/admin/vendors`
3. See 3 pending vendor applications

### Browse Public Listings
1. Visit homepage
2. See approved featured listings
3. Browse by category
4. Use search and filters

### Test User Accounts
All regular users have password: `Password123`

Example user:
- Email: (check seed output for specific emails)
- Password: `Password123`

## Troubleshooting

### "Missing Supabase credentials" Error
- Check `.env.local` file exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set

### "null value in column violates not-null constraint"
- Ensure all migrations are applied
- Check database schema matches expected structure
- Verify required fields in migration files

### "insert or update violates foreign key constraint"
- Ensure parent records exist (users, categories)
- Check referential integrity of relationships
- Verify user creation succeeded before listing creation

### Zero Records Created
- Check database connection
- Verify Supabase credentials are correct
- Check network connectivity
- Review console output for specific errors

## Requirements Validation

This seed script fulfills the following requirements:

- **12.1** - Generates minimum 20 users, 10 vendors, 50 listings ✅
- **12.2** - Includes listings across all categories with complete data ✅
- **12.3** - Includes vendor profiles with varying approval statuses ✅
- **12.4** - Maintains referential integrity ✅
- **12.5** - Checks for existing data and skips generation if data exists ✅
- **12.6** - Includes realistic Nigerian cities, phone numbers, and business names ✅
- **12.7** - Populates images (3-5 sample images per listing) ✅

## Next Steps

After running the seed script:

1. **Test Authentication:**
   - Log in as admin
   - Log in as regular user
   - Test password reset flow

2. **Test Admin Workflows:**
   - Approve pending listings
   - Reject listings with reasons
   - Review vendor applications
   - Approve vendor applications

3. **Test User Features:**
   - Browse listings
   - Search and filter
   - View listing details
   - View image galleries

4. **Test Vendor Features:**
   - View vendor badges on profiles
   - See approved vendor listings
   - Test vendor application process

## Maintenance

### Re-running the Script
The script can be re-run safely. It will:
- Skip existing users, categories, and records
- Add new data if needed
- Not create duplicates

### Clearing Seed Data
To clear all seed data and start fresh:

```sql
-- Delete in order to respect foreign keys
DELETE FROM vendor_applications WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@findam.ng');
DELETE FROM approved_vendors WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@findam.ng');
DELETE FROM listings WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@findam.ng');
DELETE FROM users WHERE email != 'admin@findam.ng';

-- Reset categories if needed (only if they're seed categories)
-- DELETE FROM categories WHERE name IN ('Services', 'Products', 'Opportunities', 'Education', 'Health', 'Technology', 'Fashion', 'Food', 'Real Estate', 'Events');
```

## Related Files

- `scripts/seed-data.ts` - Main seed script
- `scripts/verify-seed.ts` - Verification script
- `data/categories-seed.ts` - Category seed data (if needed for detailed taxonomy)
- `scripts/seed-categories.ts` - Standalone category seeding script

## Support

For issues or questions:
1. Check the console output for specific error messages
2. Review the troubleshooting section above
3. Verify database migrations are up to date
4. Check Supabase dashboard for data verification
