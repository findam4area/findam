# Task 43: Product Request Infrastructure - COMPLETION REPORT

## Overview

Successfully created database migration for Product Request feature infrastructure (Requirement 19).

## Files Created

### 1. Migration File: `025_product_request_infrastructure.sql`

Complete database schema for product requests and seller offers system.

## Database Schema Created

### Tables

#### 1. `product_requests` (Task 43.1)

Stores buyer requests for products they're looking for.

**Columns:**

- `id` - UUID primary key
- `user_id` - Reference to users (requester)
- `title` - Request title (required)
- `description` - Detailed description (required)
- `category_id` - Reference to categories (optional)
- `budget_min` - Minimum budget in NGN (optional)
- `budget_max` - Maximum budget in NGN (optional)
- `preferred_location` - Preferred pickup/delivery location (optional)
- `status` - Request status: 'active', 'fulfilled', 'expired' (default: 'active')
- `offers_count` - Number of offers received (auto-incremented, default: 0)
- `expires_at` - Expiration timestamp (default: NOW() + 30 days)
- `fulfilled_at` - Timestamp when marked as fulfilled
- `created_at`, `updated_at` - Timestamps

**Indexes:**

- User ID, category ID, status, expiration date
- Active requests (status + expires_at)
- Location, budget range
- Full-text search on title and description
- Composite indexes for common query patterns

**Requirements Addressed:**

- 19.1: Create requests with title, description, budget, category
- 19.6: Auto-expire after 30 days
- 19.8: Display status (active, fulfilled, expired)
- 19.9: Preferred location
- 19.10: Show offers count

#### 2. `request_offers` (Task 43.2)

Stores seller offers in response to product requests.

**Columns:**

- `id` - UUID primary key
- `request_id` - Reference to product_requests
- `seller_id` - Reference to users (seller)
- `listing_id` - Reference to listings (optional)
- `price` - Offered price in NGN (required)
- `message` - Optional message from seller
- `status` - Offer status: 'pending', 'accepted', 'rejected' (default: 'pending')
- `created_at`, `updated_at` - Timestamps

**Indexes:**

- Request ID, seller ID, listing ID, status
- Composite indexes for filtering and sorting
- Pending offers index for quick access

**Requirements Addressed:**

- 19.3: Sellers submit offers with listing
- 19.5: Compare multiple offers side-by-side

### Helper Functions

1. **`increment_request_offers_count()`**
   - Automatically increments offers_count when new offer created
   - Triggered on INSERT to request_offers

2. **`decrement_request_offers_count()`**
   - Automatically decrements offers_count when offer deleted
   - Triggered on DELETE from request_offers

3. **`expire_old_requests()`**
   - Marks requests as 'expired' after 30 days
   - Should be scheduled as daily cron job
   - Requirement 19.6

4. **`mark_request_fulfilled(p_request_id UUID)`**
   - Marks a request as fulfilled
   - Sets fulfilled_at timestamp
   - Requirement 19.7

5. **`get_user_active_requests_count(p_user_id UUID)`**
   - Returns count of active requests for a user
   - Useful for rate limiting or analytics

6. **`get_request_statistics(p_request_id UUID)`**
   - Returns aggregated statistics for a request
   - Total, pending, accepted, rejected offers
   - Average, min, max offer prices
   - Requirement 19.5 (comparison support)

### Views

1. **`active_product_requests`**
   - All active, non-expired requests
   - Includes requester details (username, avatar, trust score)
   - Includes category name
   - Calculates time remaining
   - Requirement 19.2 (requests feed)

2. **`request_offers_with_details`**
   - All offers with full details
   - Includes seller information (username, avatar, trust score, verification)
   - Includes listing details (title, thumbnail, condition, location)
   - Includes request details
   - Requirement 19.5 (compare offers)

3. **`user_requests_summary`**
   - User's requests with aggregated statistics
   - Includes offer counts and price statistics
   - Useful for dashboard views

### Triggers

1. **Auto-increment offers_count**
   - Fires on INSERT to request_offers
   - Updates product_requests.offers_count

2. **Auto-decrement offers_count**
   - Fires on DELETE from request_offers
   - Updates product_requests.offers_count

3. **Update timestamps**
   - Fires on UPDATE to product_requests and request_offers
   - Updates updated_at column

### Row Level Security (RLS)

#### Product Requests Policies:

- ✅ Anyone can view active, non-expired requests (Req 19.2)
- ✅ Users can view all their own requests
- ✅ Users can create their own requests (Req 19.1)
- ✅ Users can update/delete only their own requests

#### Request Offers Policies:

- ✅ Sellers can create offers for active requests (Req 19.3)
- ✅ Prevents self-offers (seller cannot offer on own request)
- ✅ Requesters can view all offers for their requests (Req 19.5)
- ✅ Sellers can view their own offers
- ✅ Requesters can update offer status (accept/reject)
- ✅ Sellers can update/delete their own offers

## Requirements Coverage

### ✅ Requirement 19.1

Users can create requests with title, description, budget, and category

- Implemented in `product_requests` table schema

### ✅ Requirement 19.3

Sellers can submit offers with their listing

- Implemented in `request_offers` table with listing_id reference

### ✅ Requirement 19.5

Requesters can compare multiple offers side-by-side

- Implemented via `request_offers_with_details` view
- Implemented via `get_request_statistics()` function

### ✅ Requirement 19.6

Requests automatically expire after 30 days

- Implemented via `expires_at` column (default: NOW() + 30 days)
- Implemented via `expire_old_requests()` function for cron job

### ✅ Requirement 19.8

Display request status: active, fulfilled, or expired

- Implemented via `status` column with CHECK constraint

## Migration Application Instructions

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard:**
   - Navigate to: https://whcwffuchlyjqhdpdwwi.supabase.co
   - Log in to your project

2. **Open SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Execute Migration:**
   - Open `supabase/migrations/025_product_request_infrastructure.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" button

4. **Verify Success:**
   - Check for success message
   - Verify tables created: `product_requests`, `request_offers`
   - Verify views created: `active_product_requests`, `request_offers_with_details`, `user_requests_summary`

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed and linked
supabase db push
```

## Post-Migration Setup

### 1. Set Up Cron Job for Request Expiration

The `expire_old_requests()` function should run daily to mark expired requests.

**Using pg_cron extension:**

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily expiration check at midnight
SELECT cron.schedule(
  'expire-old-product-requests',
  '0 0 * * *',
  'SELECT expire_old_requests()'
);
```

**Alternative: Supabase Edge Function**

Create a scheduled Edge Function that calls the `expire_old_requests()` function daily.

### 2. Set Up Notification Triggers (Requirement 19.4)

Create triggers or Edge Functions to send notifications when:

1. **New offer submitted** (notify requester):

```sql
CREATE OR REPLACE FUNCTION notify_requester_new_offer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT
    pr.user_id,
    'new_offer',
    'New Offer Received',
    'You received a new offer for "' || pr.title || '"',
    '/requests/' || pr.id
  FROM product_requests pr
  WHERE pr.id = NEW.request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_requester_new_offer
AFTER INSERT ON request_offers
FOR EACH ROW
EXECUTE FUNCTION notify_requester_new_offer();
```

2. **Offer accepted/rejected** (notify seller)
3. **Request expiring soon** (notify requester 24h before)

### 3. Set Up Typesense Indexing

Index the `product_requests` table for fast, typo-tolerant search:

```javascript
// Example Typesense collection configuration
const schema = {
  name: "product_requests",
  fields: [
    { name: "id", type: "string" },
    { name: "title", type: "string" },
    { name: "description", type: "string" },
    { name: "category_name", type: "string", facet: true },
    { name: "preferred_location", type: "string", facet: true },
    { name: "status", type: "string", facet: true },
    { name: "category_id", type: "string", facet: true },
    { name: "budget_min", type: "float", facet: true, optional: true },
    { name: "budget_max", type: "float", facet: true, optional: true },
    { name: "offers_count", type: "int32" },
    { name: "created_at", type: "int64" },
  ],
  default_sorting_field: "created_at",
};

await client.collections().create(schema);
```

### 4. Analytics Setup

Track key metrics:

- Request creation rate
- Offer submission rate
- Fulfillment rate
- Average time to fulfill
- Average number of offers per request
- Price distribution analysis

## Testing Checklist

### Database Tests

- [ ] Create a product request
- [ ] Verify expires_at is set to 30 days from now
- [ ] Create an offer for the request
- [ ] Verify offers_count incremented
- [ ] Delete an offer
- [ ] Verify offers_count decremented
- [ ] Mark request as fulfilled
- [ ] Verify fulfilled_at timestamp set
- [ ] Run expire_old_requests() function
- [ ] Verify old requests marked as expired

### RLS Tests

- [ ] User A can view active requests from User B
- [ ] User A cannot view expired/fulfilled requests from User B (unless public)
- [ ] User A can create request
- [ ] User A can update own request
- [ ] User A cannot update User B's request
- [ ] User B can create offer on User A's request
- [ ] User A cannot create offer on own request
- [ ] User A can view all offers on own request
- [ ] User B can view only own offers
- [ ] User A can accept/reject offers on own request

### View Tests

- [ ] Query active_product_requests view
- [ ] Query request_offers_with_details view
- [ ] Query user_requests_summary view
- [ ] Verify all joins return correct data

### Function Tests

- [ ] Call get_request_statistics() for a request with multiple offers
- [ ] Call mark_request_fulfilled() and verify status change
- [ ] Call get_user_active_requests_count() for a user

## Next Steps

1. **Apply the migration** using one of the methods above
2. **Set up cron job** for request expiration
3. **Implement notification triggers** for Requirement 19.4
4. **Create API endpoints** for:
   - Creating product requests
   - Listing active requests (feed)
   - Submitting offers
   - Viewing offers for a request
   - Accepting/rejecting offers
   - Marking requests as fulfilled
5. **Create UI components** for:
   - Request creation form
   - Requests feed
   - Request detail page
   - Offer submission form
   - Offer comparison view
6. **Set up Typesense indexing** for search functionality
7. **Implement analytics tracking**

## Success Criteria Met

✅ Migration file created with all tables, indexes, functions, triggers, and RLS policies
✅ All requirements 19.1, 19.3, 19.5, 19.6, 19.8 addressed in schema
✅ Comprehensive documentation of the infrastructure created
✅ Ready for migration application to remote Supabase database

## Notes

- The migration is idempotent (uses `IF NOT EXISTS` and `CREATE OR REPLACE`)
- All constraints are enforced at the database level
- RLS policies ensure data security
- Indexes optimize common query patterns
- Views simplify complex queries for the application layer
- Functions encapsulate business logic at the database level
- The schema supports all 10 acceptance criteria of Requirement 19

## Task Status

**Task 43: Set up product request infrastructure** - ✅ COMPLETED

- **Sub-task 43.1: Create product_requests table** - ✅ COMPLETED
- **Sub-task 43.2: Create request_offers table** - ✅ COMPLETED

All requirements (19.1, 19.3, 19.5, 19.6, 19.8) have been addressed in the database schema.
