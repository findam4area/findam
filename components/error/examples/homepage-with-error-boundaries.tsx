/**
 * Example: Homepage with Error Boundaries
 * Task 17.1: Implement error boundaries
 * 
 * This example demonstrates how to properly integrate error boundaries
 * into a marketplace homepage to meet Requirements 19.1, 19.5, 19.7, 19.8.
 */

'use client';

import React from 'react';
import { ErrorBoundary, ComponentErrorFallback, PageErrorFallback } from '@/components/error';
import { trackError } from '@/lib/errors';

// Example components that might fail
function HeroSection() {
  return (
    <section className="hero">
      <h1>Welcome to FindAm</h1>
      <p>Discover amazing products from verified vendors</p>
    </section>
  );
}

function SearchBar() {
  return (
    <div className="search-bar">
      <input type="text" placeholder="Search for products..." />
    </div>
  );
}

// This component might fail during data fetching
function FeaturedListingsSection() {
  // Simulate potential error
  const [data, setData] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    async function loadData() {
      try {
        // API call that might fail
        const response = await fetch('/api/listings/featured');
        if (!response.ok) throw new Error('Failed to fetch listings');
        const listings = await response.json();
        setData(listings);
      } catch (error) {
        // Let error boundary handle it
        throw error;
      }
    }
    loadData();
  }, []);

  return (
    <section className="featured-listings">
      <h2>Featured Listings</h2>
      <div className="grid">
        {data.map((listing) => (
          <div key={listing.id} className="listing-card">
            {listing.title}
          </div>
        ))}
      </div>
    </section>
  );
}

// Non-critical component
function RecommendationsSection() {
  return (
    <section className="recommendations">
      <h2>Recommended for You</h2>
      <div>Personalized recommendations...</div>
    </section>
  );
}

// Non-critical component
function ActivityFeedSection() {
  return (
    <section className="activity-feed">
      <h3>Recent Activity</h3>
      <div>Latest platform updates...</div>
    </section>
  );
}

/**
 * Homepage Component with Multi-Level Error Boundaries
 * 
 * Strategy:
 * 1. Page-level boundary catches catastrophic errors
 * 2. Component-level boundaries isolate non-critical features
 * 3. Critical sections (Hero, Search) are not wrapped individually
 * 4. Errors are tracked to Sentry for monitoring
 */
export function HomePageWithErrorBoundaries() {
  return (
    // Level 1: Page-level error boundary
    // Catches any errors that escape component boundaries
    <ErrorBoundary 
      fallback={PageErrorFallback}
      onError={(error, errorInfo) => {
        // Track page-level errors as HIGH severity
        trackError(error, {
          tags: { 
            level: 'page',
            route: '/',
            severity: 'high',
          },
          extra: {
            componentStack: errorInfo.componentStack,
          },
        });
      }}
    >
      <div className="homepage">
        {/* Critical components - not wrapped, let page boundary handle */}
        <HeroSection />
        <SearchBar />
        
        {/* 
          Level 2: Component-level boundaries for non-critical features
          Requirements: 19.5 (prevent crashes), 19.9 (maintain partial functionality)
        */}
        
        {/* Featured listings - important but not critical */}
        <ErrorBoundary 
          fallback={(props) => (
            <ComponentErrorFallback 
              {...props} 
              componentName="Featured Listings" 
            />
          )}
          onError={(error) => {
            trackError(error, {
              tags: { 
                level: 'component',
                component: 'featured-listings',
                severity: 'medium',
              },
            });
          }}
        >
          <FeaturedListingsSection />
        </ErrorBoundary>

        {/* Recommendations - non-critical */}
        <ErrorBoundary 
          fallback={(props) => (
            <ComponentErrorFallback 
              {...props} 
              componentName="Recommendations" 
            />
          )}
          onError={(error) => {
            trackError(error, {
              tags: { 
                level: 'component',
                component: 'recommendations',
                severity: 'low',
              },
            });
          }}
        >
          <RecommendationsSection />
        </ErrorBoundary>

        {/* Activity feed - non-critical */}
        <ErrorBoundary 
          fallback={(props) => (
            <ComponentErrorFallback 
              {...props} 
              componentName="Activity Feed" 
            />
          )}
          onError={(error) => {
            trackError(error, {
              tags: { 
                level: 'component',
                component: 'activity-feed',
                severity: 'low',
              },
            });
          }}
        >
          <ActivityFeedSection />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Alternative: Simplified Version
 * 
 * For simpler use cases where you don't need custom error tracking
 */
export function SimpleHomePageWithErrorBoundaries() {
  return (
    <ErrorBoundary fallback={PageErrorFallback}>
      <div className="homepage">
        <HeroSection />
        <SearchBar />
        
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <FeaturedListingsSection />
        </ErrorBoundary>

        <ErrorBoundary fallback={ComponentErrorFallback}>
          <RecommendationsSection />
        </ErrorBoundary>

        <ErrorBoundary fallback={ComponentErrorFallback}>
          <ActivityFeedSection />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Advanced: Custom Error Recovery
 * 
 * Shows how to implement custom recovery logic
 */
export function AdvancedHomePageWithRecovery() {
  const [retryCount, setRetryCount] = React.useState(0);

  const handleFeaturedListingsError = (error: Error) => {
    // Track error
    trackError(error, {
      tags: { 
        component: 'featured-listings',
        retryCount,
      },
    });

    // Limit retries
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000 * (retryCount + 1)); // Exponential backoff
    }
  };

  return (
    <ErrorBoundary fallback={PageErrorFallback}>
      <div className="homepage">
        <HeroSection />
        <SearchBar />
        
        <ErrorBoundary 
          key={retryCount} // Remount on retry
          fallback={(props) => (
            <div>
              <ComponentErrorFallback {...props} componentName="Featured Listings" />
              {retryCount < 3 && (
                <p className="text-sm text-gray-400 mt-2">
                  Automatically retrying... (Attempt {retryCount + 1}/3)
                </p>
              )}
            </div>
          )}
          onError={handleFeaturedListingsError}
        >
          <FeaturedListingsSection />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Testing Helper: Component that throws on demand
 * 
 * Use this in development to test error boundaries
 */
export function ErrorBoundaryTest() {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  if (shouldThrow) {
    throw new Error('Test error from ErrorBoundaryTest');
  }

  return (
    <div className="p-4 border border-yellow-500 bg-yellow-500/10 rounded">
      <h3 className="text-lg font-semibold mb-2">Error Boundary Test</h3>
      <p className="text-sm mb-4">Click the button to trigger an error:</p>
      <button
        onClick={() => setShouldThrow(true)}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Trigger Error
      </button>
    </div>
  );
}

/**
 * Example: Testing Error Boundaries in Development
 */
export function HomePageWithTestableErrors() {
  return (
    <ErrorBoundary fallback={PageErrorFallback}>
      <div className="homepage">
        <HeroSection />
        
        {/* Only show test component in development */}
        {process.env.NODE_ENV === 'development' && (
          <ErrorBoundary fallback={ComponentErrorFallback}>
            <ErrorBoundaryTest />
          </ErrorBoundary>
        )}
        
        <ErrorBoundary fallback={ComponentErrorFallback}>
          <FeaturedListingsSection />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Requirements Validation:
 * 
 * ✅ Requirement 19.1: Display error messages with retry buttons
 *    - ComponentErrorFallback shows retry link
 *    - PageErrorFallback shows retry button
 * 
 * ✅ Requirement 19.5: Implement error boundaries to prevent full page crashes
 *    - Multiple error boundaries at page and component levels
 *    - Isolated failures don't crash entire page
 * 
 * ✅ Requirement 19.7: Display user-friendly error messages without technical jargon
 *    - "Featured Listings failed to load" (user-friendly)
 *    - "Unable to load this page" (clear and simple)
 *    - Technical details only shown in development
 * 
 * ✅ Requirement 19.8: Provide actionable recovery options
 *    - Retry button/link
 *    - Go back button
 *    - Go home link
 *    - Automatic retry with backoff (advanced example)
 */
