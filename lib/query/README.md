# TanStack Query State Management

This directory contains the TanStack Query (React Query) v5 implementation for data fetching and state management in the FindAm marketplace.

## Overview

The implementation follows the requirements from the sophisticated-marketplace-homepage spec (Requirements 29.1-29.9):

- ✅ **29.1**: TanStack Query for all data fetching operations
- ✅ **29.2**: Hierarchical query key structure
- ✅ **29.3**: 5-minute stale time for listing data
- ✅ **29.4**: Optimistic updates with rollback on failure
- ✅ **29.5**: Infinite queries for paginated feeds
- ✅ **29.6**: Query invalidation on mutations
- ✅ **29.7**: Retry logic with exponential backoff
- ✅ **29.8**: Prefetching for anticipated navigation
- ✅ **29.9**: Query placeholders for stale data

## Directory Structure

```
lib/query/
├── keys.ts                           # Hierarchical query keys
├── hooks/
│   ├── useListings.ts               # Listing query hooks
│   ├── useVendors.ts                # Vendor query hooks with prefetching
│   ├── useActivities.ts             # Activity feed with realtime
│   └── useRecommendations.ts        # Personalized recommendations
├── mutations/
│   ├── useInteractions.ts           # Like, save, follow mutations
│   ├── useListingMutations.ts       # Listing CRUD mutations
│   └── useVendorMutations.ts        # Vendor profile mutations
├── __tests__/
│   ├── query-provider.test.tsx      # Provider configuration tests
│   └── keys.test.ts                 # Query keys tests
├── index.ts                          # Central exports
└── README.md                         # This file
```

## Configuration

The QueryClient is configured in `lib/providers/query-provider.tsx` with:

- **Stale Time**: 5 minutes for listings (Requirement 29.3)
- **GC Time**: 10 minutes for unused data
- **Retry Logic**: Up to 3 retries with exponential backoff (1s, 2s, 4s)
- **No Retry on 4xx**: Client errors are not retried
- **Placeholder Data**: Shows stale data while refetching (Requirement 29.9)

## Query Keys

Query keys follow a hierarchical structure (Requirement 29.2):

```typescript
// Pattern: [entity, scope, ...filters]

// Listings
['listings']                                    // All listings
['listings', 'featured']                        // Featured listings
['listings', 'detail', listingId]              // Single listing
['listings', 'category', categoryId]           // Category listings
['listings', 'infinite', filters]              // Infinite scroll

// Vendors
['vendors']                                     // All vendors
['vendors', 'featured']                         // Featured vendors
['vendors', 'detail', vendorId]                // Single vendor

// Activities
['activities', 'recent', limit]                // Recent activities

// Recommendations
['recommendations', 'user', userId]            // User recommendations
['recommendations', 'trending']                // Trending items
```

## Usage Examples

### Fetching Data

```typescript
import { useFeaturedListings, useVendor } from '@/lib/query';

function HomePage() {
  // Fetch featured listings with 5-minute cache
  const { data: listings, isLoading } = useFeaturedListings();
  
  return (
    <div>
      {isLoading ? <Skeleton /> : <ListingGrid listings={listings} />}
    </div>
  );
}
```

### Infinite Scroll

```typescript
import { useInfiniteListings } from '@/lib/query';

function ListingFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteListings({ category_id: 'electronics' });
  
  const listings = data?.pages.flat() ?? [];
  
  return (
    <div>
      <ListingGrid listings={listings} />
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Optimistic Updates

```typescript
import { useLikeListing } from '@/lib/query';

function LikeButton({ listingId, userId }) {
  const likeMutation = useLikeListing();
  
  const handleLike = () => {
    // Optimistically updates UI, rolls back on error
    likeMutation.mutate({ listingId, userId });
  };
  
  return (
    <button onClick={handleLike} disabled={likeMutation.isPending}>
      {likeMutation.isPending ? 'Liking...' : 'Like'}
    </button>
  );
}
```

### Prefetching

```typescript
import { usePrefetchVendor } from '@/lib/query';

function VendorCard({ vendor }) {
  const prefetchVendor = usePrefetchVendor();
  
  return (
    <Link
      href={`/vendor/${vendor.id}`}
      onMouseEnter={() => prefetchVendor(vendor.id)}
    >
      {vendor.name}
    </Link>
  );
}
```

### Realtime Subscriptions

```typescript
import { useRealtimeActivities } from '@/lib/query';

function ActivityFeed() {
  // Automatically subscribes to realtime updates
  const { data: activities } = useRealtimeActivities(20);
  
  return (
    <div>
      {activities?.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
```

### Mutations with Invalidation

```typescript
import { useCreateListing } from '@/lib/query';

function CreateListingForm() {
  const createMutation = useCreateListing();
  
  const handleSubmit = (data) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        // Automatically invalidates:
        // - All listings queries
        // - Category-specific queries
        // - Vendor-specific queries
        // - Featured listings (if boosted)
        toast.success('Listing created!');
      },
    });
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Error Handling

The query client is configured with automatic retry logic:

- **Network/Server Errors**: Retry up to 3 times with exponential backoff
- **Client Errors (4xx)**: No retry
- **Optimistic Updates**: Automatic rollback on error

```typescript
const { data, error, isError } = useFeaturedListings();

if (isError) {
  return <ErrorFallback error={error} />;
}
```

## Testing

Tests are located in `__tests__/` and cover:

- Query provider configuration
- Hierarchical query key structure
- Retry logic and exponential backoff
- Key consistency

Run tests:
```bash
npm test -- lib/query/__tests__
```

## Best Practices

1. **Always use query keys from `queryKeys`**: Don't create ad-hoc keys
2. **Leverage stale-while-revalidate**: Users see cached data instantly
3. **Use optimistic updates for interactions**: Better UX for likes, saves
4. **Prefetch on hover**: Improve perceived performance
5. **Let mutations handle invalidation**: Don't manually invalidate unless needed
6. **Use infinite queries for feeds**: Better than manual pagination

## Related Documentation

- [TanStack Query v5 Docs](https://tanstack.com/query/latest)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Design Document](/.kiro/specs/sophisticated-marketplace-homepage/design.md)
- [Requirements](/.kiro/specs/sophisticated-marketplace-homepage/requirements.md)
