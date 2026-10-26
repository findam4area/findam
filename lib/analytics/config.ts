/**
 * Analytics Configuration
 * Centralizes analytics setup for Vercel Analytics and PostHog
 * Requirements: 18.1, 18.2, 30.1, 30.2
 */

export const ANALYTICS_CONFIG = {
  // Vercel Analytics
  vercel: {
    enabled: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED === 'true',
    debug: process.env.NODE_ENV === 'development',
  },
  
  // PostHog Configuration
  posthog: {
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
    apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    enabled: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
    
    // Feature flags and A/B testing
    enableFeatureFlags: true,
    
    // Session recording
    enableSessionRecording: process.env.NEXT_PUBLIC_POSTHOG_RECORDING === 'true',
    
    // Autocapture settings
    autocapture: {
      enabled: true,
      capturePageview: true,
      capturePageleave: true,
      captureClicks: true,
    },
    
    // Privacy settings
    respectDNT: true,
    maskAllText: false,
    maskAllInputs: true,
  },
  
  // Custom event tracking configuration
  events: {
    // Search events
    search: {
      query: 'search_query',
      autocomplete: 'search_autocomplete',
      results: 'search_results',
    },
    
    // Filter events
    filter: {
      applied: 'filter_applied',
      cleared: 'filter_cleared',
      category: 'filter_category',
      price: 'filter_price',
      location: 'filter_location',
    },
    
    // User interaction events
    interaction: {
      save: 'listing_saved',
      unsave: 'listing_unsaved',
      share: 'listing_shared',
      contact: 'vendor_contacted',
      view: 'listing_viewed',
      like: 'listing_liked',
    },
    
    // Conversion funnel events
    funnel: {
      view: 'funnel_view',
      click: 'funnel_click',
      contact: 'funnel_contact',
      purchase: 'funnel_purchase',
    },
    
    // Scroll depth tracking
    scroll: {
      depth25: 'scroll_depth_25',
      depth50: 'scroll_depth_50',
      depth75: 'scroll_depth_75',
      depth100: 'scroll_depth_100',
    },
  },
} as const;

export type AnalyticsEvent = typeof ANALYTICS_CONFIG.events;
