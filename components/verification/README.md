# Verification Badge Components

This directory contains components for displaying and managing seller verification badges.

## Components

### VerificationBadge

Displays a verification badge with tier-based colors and interactive modal.

**Requirements:** 15.1, 15.8  
**Tasks:** 28.1

**Props:**

- `tier`: Badge tier ("none" | "basic" | "trusted" | "power")
- `showLabel`: Whether to show the badge label text
- `phoneVerified`: Phone verification status
- `ninVerified`: NIN verification status
- `videoVerified`: Video verification status
- `transactionCount`: Number of successful transactions
- `averageRating`: Average seller rating

**Badge Colors:**

- Basic Verified: Green (#10b981)
- Trusted Seller: Blue (#3b82f6)
- Power Seller: Gold (#f59e0b)

**Usage:**

```tsx
import { VerificationBadge } from "@/components/verification";

<VerificationBadge
  tier="trusted"
  showLabel={true}
  phoneVerified={true}
  ninVerified={true}
  videoVerified={true}
  transactionCount={15}
  averageRating={4.7}
/>;
```

### BadgeDetailsModal

Modal that displays verification details and badge criteria when a badge is clicked.

**Requirements:** 15.6  
**Tasks:** 28.3

Shows:

- Verification status (phone, NIN, video)
- Performance metrics (transactions, rating)
- Badge criteria for all tiers
- Benefits of verification

## Hooks

### useSellerBadge

Hook to fetch seller badge information from the API.

**Usage:**

```tsx
import { useSellerBadge } from "@/lib/hooks/useSellerBadge";

const { badge, loading } = useSellerBadge(userId);
```

## API Endpoints

### GET /api/verification/badge

Get badge for a specific user.

**Query Parameters:**

- `userId`: User ID (required)

### GET /api/verification/badge/check

Check badge criteria and eligibility for a user.

**Query Parameters:**

- `userId`: User ID (optional, defaults to current user)

### POST /api/verification/badge/revoke

Revoke a badge (admin only).

**Body:**

- `userId`: User ID to revoke badge from
- `reason`: Reason for revocation

## Cron Job

### GET /api/cron/check-badges

Automatically checks and updates badges for all users.

**Requirements:** 15.2, 15.4, 15.5, 15.7  
**Tasks:** 28.2, 28.4

- Awards higher tier badges when criteria are met
- Revokes badges when rating drops below threshold
- Should be scheduled to run daily

## Badge Criteria

### Basic Verified

- Phone verification ✓
- NIN verification ✓
- Video verification ✓

### Trusted Seller

- All Basic Verified requirements
- 10+ successful transactions
- 4.5+ average rating

### Power Seller

- All Basic Verified requirements
- 50+ successful transactions
- 4.8+ average rating

## Search Integration

Verified sellers are prioritized in search results (Requirement 15.9).

The Typesense collection includes `seller_badge_tier` as a sortable field:

- Power Seller: 3
- Trusted Seller: 2
- Basic Verified: 1
- None: 0

Search results are sorted by: `is_boosted:desc`, `seller_badge_tier:desc`, `created_at:desc`

## Notifications

Badge achievement notifications are automatically sent when sellers earn new badge tiers (Requirement 15.10).

Implemented in `VerificationService.sendBadgeNotification()`.
