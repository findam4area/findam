'use client';

/**
 * Example Component Demonstrating Analytics Integration
 * This component shows how to use the analytics tracking hooks
 * Requirements: 18.1, 18.2, 18.3, 18.4, 30.1, 30.2, 30.6
 * 
 * This is a reference implementation for Task 16.1
 * Remove this file after implementation is complete across all components
 */

import { useEffect } from 'react';
import {
  usePageTracking,
  useSearchTracking,
  useFilterTracking,
  useListingTracking,
  useCTATracking,
  useCategoryTracking,
} from '@/lib/analytics';

export function AnalyticsExample() {
  // Example 1: Page tracking (automatically tracks page views and scroll depth)
  usePageTracking('example_page');

  // Example 2: Search tracking
  const { trackSearchQuery, trackAutocompleteSelection } = useSearchTracking();

  const handleSearch = (query: string, resultsCount: number) => {
    trackSearchQuery(query, resultsCount);
  };

  const handleAutocomplete = (query: string, type: string) => {
    trackAutocompleteSelection(query, type);
  };

  // Example 3: Filter tracking
  const { trackFilterApplied, trackFilterCleared } = useFilterTracking();

  const handleFilterChange = (type: string, value: any) => {
    trackFilterApplied(type, value);
  };

  const handleClearFilters = () => {
    trackFilterCleared();
  };

  // Example 4: Listing tracking (conversion funnel)
  const { trackView, trackClick, trackSave, trackShare, trackContact, trackPurchase } =
    useListingTracking();

  // Track when listing enters viewport
  useEffect(() => {
    trackView('listing-123', 'Example Listing', {
      price: 50000,
      categoryId: 'cat-1',
      categoryName: 'Electronics',
      vendorId: 'vendor-1',
      vendorName: 'Test Vendor',
      source: 'homepage',
      position: 1,
    });
  }, [trackView]);

  const handleListingClick = () => {
    trackClick('listing-123', 'Example Listing', {
      clickElement: 'card',
      source: 'homepage',
    });
  };

  const handleSaveListing = () => {
    trackSave('listing-123', 'Example Listing');
  };

  const handleShareListing = (method: string) => {
    trackShare('listing-123', 'Example Listing', method);
  };

  const handleContactVendor = () => {
    trackContact('listing-123', 'vendor-1', {
      contactMethod: 'chat',
      messageLength: 150,
    });
  };

  const handlePurchase = () => {
    trackPurchase('listing-123', 'vendor-1', {
      price: 50000,
      quantity: 1,
      totalAmount: 50000,
      paymentMethod: 'paystack',
      orderId: 'order-123',
    });
  };

  // Example 5: CTA tracking
  const { trackCTAClick } = useCTATracking();

  const handleCTA = () => {
    trackCTAClick('hero_signup', 'Get Started Free', 'hero_section');
  };

  // Example 6: Category tracking
  const { trackCategoryView, trackCategoryClick } = useCategoryTracking();

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    trackCategoryClick(categoryId, categoryName, 'homepage');
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Analytics Integration Example</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Search Tracking</h2>
        <button
          onClick={() => handleSearch('laptop', 45)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Track Search
        </button>
        <button
          onClick={() => handleAutocomplete('laptop', 'listing')}
          className="px-4 py-2 bg-blue-500 text-white rounded ml-2"
        >
          Track Autocomplete
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Filter Tracking</h2>
        <button
          onClick={() => handleFilterChange('price', { min: 0, max: 50000 })}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Track Filter Applied
        </button>
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 bg-green-500 text-white rounded ml-2"
        >
          Track Filter Cleared
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Listing Interactions (Conversion Funnel)</h2>
        <button
          onClick={handleListingClick}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          Track Click (Step 2)
        </button>
        <button
          onClick={handleSaveListing}
          className="px-4 py-2 bg-purple-500 text-white rounded ml-2"
        >
          Track Save
        </button>
        <button
          onClick={() => handleShareListing('whatsapp')}
          className="px-4 py-2 bg-purple-500 text-white rounded ml-2"
        >
          Track Share
        </button>
        <button
          onClick={handleContactVendor}
          className="px-4 py-2 bg-purple-500 text-white rounded ml-2"
        >
          Track Contact (Step 3)
        </button>
        <button
          onClick={handlePurchase}
          className="px-4 py-2 bg-purple-500 text-white rounded ml-2"
        >
          Track Purchase (Step 4)
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">CTA Tracking</h2>
        <button
          onClick={handleCTA}
          className="px-4 py-2 bg-orange-500 text-white rounded"
        >
          Track CTA Click
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Category Tracking</h2>
        <button
          onClick={() => handleCategorySelect('cat-1', 'Electronics')}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Track Category Click
        </button>
      </section>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Tracking Info:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Page views are tracked automatically</li>
          <li>Scroll depth tracked at 25%, 50%, 75%, 100%</li>
          <li>Time on page tracked automatically</li>
          <li>Check browser console for event logs (dev mode)</li>
          <li>View events in PostHog dashboard</li>
        </ul>
      </div>
    </div>
  );
}
