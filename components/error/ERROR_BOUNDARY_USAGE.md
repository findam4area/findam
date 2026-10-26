# Error Boundary Usage Guide

This guide demonstrates how to use the error boundary system implemented in Task 17.1 for the FindAm marketplace homepage.

## Overview

The error boundary system provides multiple levels of error handling:
- **Component-level**: Isolate errors to specific components
- **Page-level**: Catch errors for entire pages
- **Layout-level**: Handle errors in route layouts (already configured)

## Requirements Implemented

- ✅ **19.1**: Display error messages with retry buttons
- ✅ **19.5**: Implement error boundaries to prevent full page crashes
- ✅ **19.7**: Display user-friendly error messages without technical jargon
- ✅ **19.8**: Provide actionable recovery options (retry, refresh, contact support)

## Components

### 1. ErrorBoundary (Base Component)

Generic error boundary that can wrap any component tree.

```tsx
import { ErrorBoundary } from '@/components/error';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Props:**
- `children`: React nodes to protect
- `fallback`: Optional custom fallback component
- `onError`: Optional error handler callback

**Example with custom error handler:**
```tsx
<ErrorBoundary 
  onError={(error, errorInfo) => {
    console.log('Custom error logging:', error);
    // Send to analytics, etc.
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### 2. ComponentErrorFallback

Minimal error UI for component-level failures. Best for non-critical components.

```tsx
import { ErrorBoundary, ComponentErrorFallback } from '@/components/error';

<ErrorBoundary fallback={ComponentErrorFallback}>
  <RecommendationsSection />
</ErrorBoundary>
```

**With component name:**
```tsx
<ErrorBoundary 
  fallback={(props) => (
    <ComponentErrorFallback 
      {...props} 
      componentName="Recommendations" 
    />
  )}
>
  <RecommendationsSection />
</ErrorBoundary>
```

**Features:**
- Inline error message
- Retry link
- Minimal space usage
- Non-intrusive design

### 3. PageErrorFallback

Full-featured error UI for page-level failures.

```tsx
import { ErrorBoundary, PageErrorFallback } from '@/components/error';

<ErrorBoundary fallback={PageErrorFallback}>
  <HomePage />
</ErrorBoundary>
```

**Features:**
- Prominent error display
- Retry button
- Go back navigation
- Clear user guidance

## Layout-Level Error Boundaries

Error boundaries are already configured for all route layouts:

- `app/error.tsx` - Root layout errors
- `app/(main)/error.tsx` - Main layout errors
- `app/(admin)/error.tsx` - Admin layout errors
- `app/(auth)/error.tsx` - Auth layout errors

These automatically catch errors in their respective route groups.

## Usage Examples

### Example 1: Protect a Data-Fetching Component

```tsx
// components/featured-listings.tsx
'use client';

import { ErrorBoundary, ComponentErrorFallback } from '@/components/error';
import { useQuery } from '@tanstack/react-query';

function FeaturedListingsContent() {
  const { data, error } = useQuery({
    queryKey: ['listings', 'featured'],
    queryFn: fetchFeaturedListings,
  });

  if (error) throw error; // Let error boundary handle it

  return (
    <div>
      {data?.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

export function FeaturedListings() {
  return (
    <ErrorBoundary 
      fallback={(props) => (
        <ComponentErrorFallback 
          {...props} 
          componentName="Featured Listings" 
        />
      )}
    >
      <FeaturedListingsContent />
    </ErrorBoundary>
  );
}
```

### Example 2: Protect Multiple Components

```tsx
// app/(main)/page.tsx
import { ErrorBoundary, ComponentErrorFallback } from '@/components/error';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      
      {/* Protect featured listings */}
      <ErrorBoundary fallback={ComponentErrorFallback}>
        <FeaturedListings />
      </ErrorBoundary>

      {/* Protect recommendations */}
      <ErrorBoundary fallback={ComponentErrorFallback}>
        <RecommendationsSection />
      </ErrorBoundary>

      {/* Protect activity feed */}
      <ErrorBoundary fallback={ComponentErrorFallback}>
        <ActivityFeed />
      </ErrorBoundary>
    </div>
  );
}
```

### Example 3: Custom Error Handler with Sentry

```tsx
import { ErrorBoundary } from '@/components/error';
import { trackError } from '@/lib/errors';

<ErrorBoundary
  onError={(error, errorInfo) => {
    // Track to Sentry with context
    trackError(error, {
      tags: { 
        component: 'featured-listings',
        section: 'homepage',
      },
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }}
>
  <FeaturedListings />
</ErrorBoundary>
```

### Example 4: Multiple Fallback Levels

```tsx
// app/(main)/search/page.tsx
import { ErrorBoundary, PageErrorFallback, ComponentErrorFallback } from '@/components/error';

export default function SearchPage() {
  return (
    // Page-level boundary
    <ErrorBoundary fallback={PageErrorFallback}>
      <div>
        <SearchBar />
        
        {/* Component-level boundaries for non-critical sections */}
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <SearchFilters />
        </ErrorBoundary>

        {/* Critical section uses page-level fallback */}
        <SearchResults />

        <ErrorBoundary fallback={ComponentErrorFallback}>
          <RelatedSearches />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
```

### Example 5: Async Component Error Handling

```tsx
'use client';

import { ErrorBoundary, ComponentErrorFallback } from '@/components/error';
import { Suspense } from 'react';

// Async component that might throw
async function VendorStats() {
  const stats = await fetchVendorStats(); // Can throw
  return <div>{/* stats UI */}</div>;
}

export function VendorSection() {
  return (
    <ErrorBoundary fallback={ComponentErrorFallback}>
      <Suspense fallback={<LoadingSpinner />}>
        <VendorStats />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Best Practices

### 1. Granularity

**✅ DO:**
```tsx
// Wrap individual sections
<ErrorBoundary fallback={ComponentErrorFallback}>
  <Recommendations />
</ErrorBoundary>
<ErrorBoundary fallback={ComponentErrorFallback}>
  <ActivityFeed />
</ErrorBoundary>
```

**❌ DON'T:**
```tsx
// Don't wrap everything together
<ErrorBoundary>
  <Recommendations />
  <ActivityFeed />
  <FeaturedListings />
</ErrorBoundary>
```

### 2. Critical vs Non-Critical

**Critical components** (page content, forms, checkout):
- Use `PageErrorFallback`
- Provide prominent error UI
- Multiple recovery options

**Non-critical components** (recommendations, activity feeds):
- Use `ComponentErrorFallback`
- Minimal error UI
- Page remains functional

### 3. Error Tracking

Always combine with error tracking:

```tsx
<ErrorBoundary
  onError={(error) => {
    // Track to monitoring service
    if (typeof window !== 'undefined' && window.__ERROR_TRACKER__) {
      window.__ERROR_TRACKER__.captureException(error);
    }
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### 4. Development vs Production

Error boundaries automatically adapt:
- **Development**: Shows error details for debugging
- **Production**: Shows user-friendly messages only

## Testing Error Boundaries

### Manual Testing

Create a component that throws an error:

```tsx
// Test component
function ErrorTest() {
  const [shouldError, setShouldError] = useState(false);
  
  if (shouldError) {
    throw new Error('Test error');
  }
  
  return (
    <button onClick={() => setShouldError(true)}>
      Trigger Error
    </button>
  );
}

// Wrap with error boundary
<ErrorBoundary fallback={ComponentErrorFallback}>
  <ErrorTest />
</ErrorBoundary>
```

### Unit Testing

See `components/error/__tests__/error-boundary.test.tsx` for comprehensive test examples.

## Integration with Other Features

### With TanStack Query

```tsx
import { ErrorBoundary } from '@/components/error';
import { useQuery } from '@tanstack/react-query';

function DataComponent() {
  const { data, error } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    useErrorBoundary: true, // Let error boundary handle errors
  });

  return <div>{/* render data */}</div>;
}

<ErrorBoundary fallback={ComponentErrorFallback}>
  <DataComponent />
</ErrorBoundary>
```

### With Suspense

```tsx
<ErrorBoundary fallback={ComponentErrorFallback}>
  <Suspense fallback={<LoadingSkeleton />}>
    <AsyncComponent />
  </Suspense>
</ErrorBoundary>
```

### With Graceful Degradation

Combine with other error handling features from Task 17.3:

```tsx
import { ErrorBoundary, ComponentErrorFallback } from '@/components/error';
import { DataWithCacheFallback } from '@/components/error';

<ErrorBoundary fallback={ComponentErrorFallback}>
  <DataWithCacheFallback
    cacheKey="featured-listings"
    fetchData={fetchFeaturedListings}
  >
    {(data) => <FeaturedListings listings={data} />}
  </DataWithCacheFallback>
</ErrorBoundary>
```

## Troubleshooting

### Error boundary not catching errors

**Issue**: Error boundary doesn't catch the error.

**Solution**: Error boundaries only catch errors in:
- Rendering
- Lifecycle methods
- Constructors

They **don't** catch errors in:
- Event handlers (use try-catch)
- Async code (use try-catch or promises)
- Server-side rendering
- Errors thrown in the error boundary itself

### Example of event handler errors:

```tsx
// ❌ Error boundary won't catch this
function Component() {
  return (
    <button onClick={() => {
      throw new Error('Not caught');
    }}>
      Click
    </button>
  );
}

// ✅ Handle event errors manually
function Component() {
  const handleClick = () => {
    try {
      // risky operation
    } catch (error) {
      console.error(error);
      // Show error message to user
    }
  };

  return <button onClick={handleClick}>Click</button>;
}
```

## Accessibility

All error boundaries are accessible:
- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader support

## Performance

Error boundaries have minimal performance impact:
- Only active when errors occur
- No overhead in happy path
- Efficient re-rendering

## Related Documentation

- [Error Tracking (Sentry)](../lib/errors/SENTRY_SETUP.md)
- [Graceful Degradation](../lib/errors/USAGE_EXAMPLES.md)
- [Testing Guide](../lib/errors/README.md)

## Summary

The error boundary system provides:
- ✅ Multiple levels of error handling
- ✅ User-friendly error messages
- ✅ Retry and recovery options
- ✅ Automatic Sentry integration
- ✅ Development and production modes
- ✅ Accessible error UI
- ✅ Comprehensive test coverage

For issues or questions, refer to the main error handling documentation at `lib/errors/README.md`.
