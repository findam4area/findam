'use client';

/**
 * Custom React Hooks for Analytics Tracking
 * Provides easy-to-use hooks for tracking user interactions
 * Requirements: 18.3, 18.4, 30.6
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  trackSearch,
  trackAutocomplete,
  trackFilter,
  trackSave,
  trackShare,
  trackContact,
  trackListingView,
  trackEvent,
} from './index';
import {
  trackListingViewFunnel,
  trackListingClickFunnel,
  trackVendorContactFunnel,
  trackPurchaseFunnel,
} from './conversion-funnel';
import { useScrollDepth } from './use-scroll-depth';

/**
 * Hook for tracking search events
 * Requirements: 18.3
 */
export function useSearchTracking() {
  const trackSearchQuery = useCallback((query: string, resultsCount: number) => {
    trackSearch(query, resultsCount);
  }, []);

  const trackAutocompleteSelection = useCallback(
    (query: string, selectedType: string) => {
      trackAutocomplete(query, selectedType);
    },
    []
  );

  return {
    trackSearchQuery,
    trackAutocompleteSelection,
  };
}

/**
 * Hook for tracking filter events
 * Requirements: 18.3
 */
export function useFilterTracking() {
  const trackFilterApplied = useCallback(
    (filterType: string, filterValue: any) => {
      trackFilter(filterType, filterValue);
    },
    []
  );

  const trackFilterCleared = useCallback(() => {
    trackEvent('filter_cleared', {
      timestamp: new Date().toISOString(),
    });
  }, []);

  return {
    trackFilterApplied,
    trackFilterCleared,
  };
}

/**
 * Hook for tracking listing interactions
 * Requirements: 18.3, 18.4
 */
export function useListingTracking() {
  const trackView = useCallback(
    (
      listingId: string,
      listingTitle: string,
      metadata?: {
        price?: number;
        categoryId?: string;
        categoryName?: string;
        vendorId?: string;
        vendorName?: string;
        source?: string;
        position?: number;
      }
    ) => {
      // Track regular listing view
      trackListingView(listingId, listingTitle);
      
      // Track funnel view
      trackListingViewFunnel(listingId, listingTitle, metadata);
    },
    []
  );

  const trackClick = useCallback(
    (
      listingId: string,
      listingTitle: string,
      metadata?: {
        price?: number;
        categoryId?: string;
        categoryName?: string;
        vendorId?: string;
        vendorName?: string;
        clickElement?: string;
        source?: string;
      }
    ) => {
      trackListingClickFunnel(listingId, listingTitle, metadata);
    },
    []
  );

  const trackSaveListing = useCallback((listingId: string, listingTitle: string) => {
    trackSave(listingId, listingTitle);
  }, []);

  const trackShareListing = useCallback(
    (listingId: string, listingTitle: string, shareMethod: string) => {
      trackShare(listingId, listingTitle, shareMethod);
    },
    []
  );

  const trackContactVendor = useCallback(
    (
      listingId: string,
      vendorId: string,
      metadata?: {
        listingTitle?: string;
        vendorName?: string;
        contactMethod?: string;
        messageLength?: number;
      }
    ) => {
      // Track regular contact
      trackContact(vendorId, listingId);
      
      // Track funnel contact
      trackVendorContactFunnel(listingId, vendorId, metadata);
    },
    []
  );

  const trackPurchase = useCallback(
    (
      listingId: string,
      vendorId: string,
      metadata?: {
        listingTitle?: string;
        vendorName?: string;
        price?: number;
        quantity?: number;
        totalAmount?: number;
        paymentMethod?: string;
        orderId?: string;
      }
    ) => {
      trackPurchaseFunnel(listingId, vendorId, metadata);
    },
    []
  );

  return {
    trackView,
    trackClick,
    trackSave: trackSaveListing,
    trackShare: trackShareListing,
    trackContact: trackContactVendor,
    trackPurchase,
  };
}

/**
 * Hook for tracking time spent on page
 * Requirements: 18.6
 */
export function useTimeTracking(pageName: string) {
  const startTime = useRef<number>(Date.now());
  const hasTracked = useRef<boolean>(false);

  useEffect(() => {
    const trackTimeSpent = () => {
      if (!hasTracked.current) {
        const timeSpent = Date.now() - startTime.current;
        trackEvent('time_on_page', {
          page: pageName,
          duration_ms: timeSpent,
          duration_seconds: Math.round(timeSpent / 1000),
          timestamp: new Date().toISOString(),
        });
        hasTracked.current = true;
      }
    };

    // Track when user leaves page
    window.addEventListener('beforeunload', trackTimeSpent);

    // Also track after 30 seconds
    const timeout = setTimeout(trackTimeSpent, 30000);

    return () => {
      window.removeEventListener('beforeunload', trackTimeSpent);
      clearTimeout(timeout);
    };
  }, [pageName]);
}

/**
 * Hook for tracking page views with automatic scroll depth tracking
 * Requirements: 18.1, 18.6, 30.7
 */
export function usePageTracking(pageName: string) {
  // Track scroll depth
  useScrollDepth();

  // Track time spent
  useTimeTracking(pageName);

  // Track page view
  useEffect(() => {
    trackEvent('page_view', {
      page: pageName,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    });
  }, [pageName]);
}

/**
 * Hook for tracking CTA button clicks
 * Requirements: 18.2
 */
export function useCTATracking() {
  const trackCTAClick = useCallback(
    (buttonId: string, buttonText: string, position?: string) => {
      trackEvent('cta_click', {
        button_id: buttonId,
        button_text: buttonText,
        position,
        timestamp: new Date().toISOString(),
      });
    },
    []
  );

  return { trackCTAClick };
}

/**
 * Hook for tracking category navigation
 * Requirements: 18.3
 */
export function useCategoryTracking() {
  const trackCategoryView = useCallback((categoryId: string, categoryName: string) => {
    trackEvent('category_view', {
      category_id: categoryId,
      category_name: categoryName,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const trackCategoryClick = useCallback(
    (categoryId: string, categoryName: string, source?: string) => {
      trackEvent('category_click', {
        category_id: categoryId,
        category_name: categoryName,
        source,
        timestamp: new Date().toISOString(),
      });
    },
    []
  );

  return {
    trackCategoryView,
    trackCategoryClick,
  };
}

/**
 * Hook for tracking user engagement metrics
 * Requirements: 18.2, 18.3
 */
export function useEngagementTracking() {
  const trackEngagement = useCallback((eventType: string, metadata?: Record<string, any>) => {
    trackEvent('user_engagement', {
      event_type: eventType,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return { trackEngagement };
}
