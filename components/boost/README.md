# Boost Components

This directory contains components for the Premium Listing Boosts feature (Requirement 14).

## Components

### BoostBadge

Displays a "Boosted" badge on listing cards to indicate premium placement.

**Requirements:** 14.3  
**Task:** 34.4

**Usage:**

```tsx
import { BoostBadge } from "@/components/boost";

<BoostBadge size="md" />;
```

### BoostPurchaseFlow

Complete purchase flow for boost packages with package selection and payment integration.

**Requirements:** 14.1, 14.4, 14.5  
**Task:** 34.10

**Features:**

- Display three boost packages (₦500/24h, ₦1000/72h, ₦2000/7 days)
- Show estimated views for each package
- Handle Paystack payment integration
- Responsive design with package comparison

**Usage:**

```tsx
import { BoostPurchaseFlow } from "@/components/boost";

<BoostPurchaseFlow
  listingId="listing-id"
  listingTitle="Product Title"
  onPurchaseComplete={() => console.log("Boost purchased")}
/>;
```

### BoostPerformanceAnalytics

Displays performance metrics for active boosts including views, impressions, and messages gained.

**Requirements:** 14.8  
**Task:** 34.9

**Features:**

- Real-time performance tracking
- Time remaining display
- Progress visualization
- Metrics breakdown (views, impressions, messages)

**Usage:**

```tsx
import { BoostPerformanceAnalytics } from "@/components/boost";

<BoostPerformanceAnalytics listingId="listing-id" />;
```

## Boost Packages

| Package  | Price  | Duration | Estimated Views |
| -------- | ------ | -------- | --------------- |
| Basic    | ₦500   | 24 hours | 500             |
| Standard | ₦1,000 | 72 hours | 2,000           |
| Premium  | ₦2,000 | 7 days   | 5,000           |

## API Integration

The components integrate with the following API endpoints:

- `POST /api/boosts/purchase` - Purchase a boost
- `GET /api/boosts/verify` - Verify payment and activate boost
- `GET /api/boosts/[listing_id]` - Get boost details and performance
- `GET /api/boosts/analytics` - Get user's boost analytics

## Implementation Notes

1. **Boosted Listing Ranking (Task 34.2):**
   - Boosted listings appear at the top of search results and feeds
   - Implemented in `/api/search/route.ts` and `/api/listings/route.ts`

2. **Boost Expiration (Task 34.5):**
   - Handled by cron job at `/api/cron/boost-expiration`
   - Returns listings to normal ranking when boost expires

3. **Expiration Notifications (Task 34.7):**
   - Sent 6 hours before expiration
   - Includes option to extend boost

4. **Performance Tracking (Task 34.9):**
   - Tracks views, impressions, and messages during boost period
   - Metrics updated in real-time via `increment_boost_metric` database function

## Database Schema

Boosts are stored in the `boosts` table with the following key fields:

- `listing_id` - Associated listing
- `package_type` - basic, standard, or premium
- `started_at` / `expires_at` - Boost duration
- `views_gained` / `impressions_gained` / `messages_received` - Performance metrics
- `paystack_reference` - Payment tracking

See `supabase/migrations/020_monetization_infrastructure.sql` for full schema.
