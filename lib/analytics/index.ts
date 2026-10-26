/**
 * Analytics Service
 * Unified interface for tracking events across Vercel Analytics and PostHog
 * Requirements: 18.1, 18.2, 18.3, 18.4, 30.1, 30.2, 30.6
 */

import posthog from 'posthog-js';
import { ANALYTICS_CONFIG } from './config';

/**
 * Track a custom event
 * Requirements: 18.3, 30.6
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  // Track in PostHog
  if (ANALYTICS_CONFIG.posthog.enabled && posthog.__loaded) {
    posthog.capture(eventName, properties);
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', eventName, properties);
  }
}

/**
 * Track search query
 * Requirements: 18.3
 */
export function trackSearch(query: string, resultsCount: number) {
  trackEvent(ANALYTICS_CONFIG.events.search.query, {
    query,
    results_count: resultsCount,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track autocomplete usage
 * Requirements: 18.3
 */
export function trackAutocomplete(query: string, selectedType: string) {
  trackEvent(ANALYTICS_CONFIG.events.search.autocomplete, {
    query,
    selected_type: selectedType,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track filter application
 * Requirements: 18.3
 */
export function trackFilter(filterType: string, filterValue: any) {
  trackEvent(ANALYTICS_CONFIG.events.filter.applied, {
    filter_type: filterType,
    filter_value: filterValue,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track listing save
 * Requirements: 18.3
 */
export function trackSave(listingId: string, listingTitle: string) {
  trackEvent(ANALYTICS_CONFIG.events.interaction.save, {
    listing_id: listingId,
    listing_title: listingTitle,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track listing share
 * Requirements: 18.3
 */
export function trackShare(
  listingId: string,
  listingTitle: string,
  shareMethod: string
) {
  trackEvent(ANALYTICS_CONFIG.events.interaction.share, {
    listing_id: listingId,
    listing_title: listingTitle,
    share_method: shareMethod,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track vendor contact
 * Requirements: 18.3
 */
export function trackContact(vendorId: string, listingId?: string) {
  trackEvent(ANALYTICS_CONFIG.events.interaction.contact, {
    vendor_id: vendorId,
    listing_id: listingId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track listing view
 * Requirements: 18.3
 */
export function trackListingView(listingId: string, listingTitle: string) {
  trackEvent(ANALYTICS_CONFIG.events.interaction.view, {
    listing_id: listingId,
    listing_title: listingTitle,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track conversion funnel step
 * Requirements: 18.4, 30.6
 */
export function trackFunnelStep(
  step: 'view' | 'click' | 'contact' | 'purchase',
  listingId: string,
  metadata?: Record<string, any>
) {
  const eventName = ANALYTICS_CONFIG.events.funnel[step];
  trackEvent(eventName, {
    listing_id: listingId,
    funnel_step: step,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track scroll depth
 * Requirements: 18.6, 30.7
 */
export function trackScrollDepth(depth: 25 | 50 | 75 | 100) {
  const eventName = ANALYTICS_CONFIG.events.scroll[`depth${depth}` as keyof typeof ANALYTICS_CONFIG.events.scroll];
  trackEvent(eventName, {
    depth,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Identify user for analytics
 * Requirements: 30.2
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, any>
) {
  if (ANALYTICS_CONFIG.posthog.enabled && posthog.__loaded) {
    posthog.identify(userId, properties);
  }
}

/**
 * Reset user identity (on logout)
 * Requirements: 30.2
 */
export function resetUser() {
  if (ANALYTICS_CONFIG.posthog.enabled && posthog.__loaded) {
    posthog.reset();
  }
}

/**
 * Set user properties
 * Requirements: 30.2
 */
export function setUserProperties(properties: Record<string, any>) {
  if (ANALYTICS_CONFIG.posthog.enabled && posthog.__loaded) {
    posthog.people.set(properties);
  }
}

// Export PostHog instance for advanced usage
export { posthog };

// Export conversion funnel tracking
export * from './conversion-funnel';

// Export custom tracking hooks
export * from './use-tracking';

// Export scroll depth tracking
export * from './use-scroll-depth';

// Export A/B testing and feature flags
export * from './feature-flags';
export * from './use-ab-test';

// NOTE: cohort-analysis is NOT exported here because it uses server-side
// functions (createClient from @/lib/supabase/server) and should only be
// imported directly in server components or API routes:
// import { calculateCohortRetention } from '@/lib/analytics/cohort-analysis';
