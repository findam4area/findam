# Storefront Components

Custom seller storefront components for FindAm marketplace.

## Components

### StorefrontHeader

Displays seller profile information including avatar, bio, verification badges, and quick stats.

**Props:**

- `storefront`: Storefront data
- `seller`: User data
- `stats`: Statistics object with sales, followers, rating, etc.

### StorefrontStats

Shows key metrics in a card layout (total sales, response time, member since).

**Props:**

- `stats`: Statistics object
- `seller`: User data

### StorefrontListings

Grid display of listings with support for featured products.

**Props:**

- `listings`: Array of listings
- `featured`: Boolean to indicate featured section

### StorefrontReviews

Displays customer reviews with rating summary.

**Props:**

- `reviews`: Array of reviews
- `averageRating`: Average rating number

### StorefrontCustomizer

Modal component for sellers to customize their storefront.

**Props:**

- `storefront`: Current storefront data
- `listings`: User's listings for featured selection
- `onUpdate`: Optional callback when storefront is updated

**Features:**

- Display name editing
- Bio text area
- Banner image URL input
- Theme color picker (8 presets + custom)
- Featured products selection (max 6)

### FollowButton

Button to follow/unfollow a storefront.

**Props:**

- `storefrontId`: Storefront ID
- `themeColor`: Optional theme color for styling

## Usage

```tsx
import {
  StorefrontHeader,
  StorefrontStats,
  StorefrontListings,
  StorefrontReviews,
  StorefrontCustomizer,
} from "@/components/storefront";

// In your page component
<StorefrontHeader storefront={data.storefront} seller={data.seller} stats={data.stats} />
<StorefrontStats stats={data.stats} seller={data.seller} />
<StorefrontListings listings={data.featuredListings} featured />
<StorefrontListings listings={data.listings} />
<StorefrontReviews reviews={data.reviews} averageRating={data.stats.averageRating} />

// For seller's own storefront management
<StorefrontCustomizer storefront={storefront} listings={listings} />
```

## API Routes

### GET /api/storefront

Get current user's storefront (creates if doesn't exist).

### PATCH /api/storefront

Update storefront customization.

**Body:**

```json
{
  "display_name": "My Store",
  "bio": "Welcome to my store",
  "banner_url": "https://...",
  "theme_color": "#3B82F6",
  "featured_listings": ["id1", "id2"]
}
```

### POST /api/storefront/follow

Follow a storefront.

**Body:**

```json
{
  "storefront_id": "uuid"
}
```

### DELETE /api/storefront/follow?storefront_id=uuid

Unfollow a storefront.

## Service

### StorefrontService

Located at `lib/services/storefront.ts`

**Methods:**

- `getStorefront(customUrl)`: Get storefront by username
- `getOrCreateStorefront(userId)`: Get or create user's storefront
- `updateStorefront(userId, updates)`: Update storefront
- `followStorefront(storefrontId, followerUserId)`: Follow a storefront
- `unfollowStorefront(storefrontId, followerUserId)`: Unfollow a storefront
- `isFollowing(storefrontId, followerUserId)`: Check follow status

## Requirements Implemented

- **9.1**: Storefront accessible at /store/[username]
- **9.2**: Display seller profile with avatar, bio, badges
- **9.3**: Show all active listings in grid
- **9.4**: Customization (banner, theme color, bio)
- **9.5**: Display seller statistics
- **9.6**: Follow functionality
- **9.8**: Featured products (up to 6)
- **9.9**: Open Graph tags for social sharing

## Mobile-First Design

All components are designed mobile-first with responsive breakpoints:

- Mobile: Single column, stacked layout
- Tablet: 2-3 column grids
- Desktop: 4 column grids, side-by-side layouts

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance
