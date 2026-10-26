/**
 * A/B Testing Configuration
 * Defines feature flags and experiment variants
 * Requirements: 18.6, 30.3, 30.7
 */

export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: string[];
  defaultVariant: string;
  enabled: boolean;
  trafficAllocation?: number; // Percentage of users to include (0-100)
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number; // Gradual rollout percentage (0-100)
}

/**
 * Active experiments configuration
 * Requirements: 30.3
 */
export const EXPERIMENTS: Record<string, Experiment> = {
  hero_cta_text: {
    id: 'hero_cta_text',
    name: 'Hero CTA Text',
    description: 'Test different CTA button text on hero section',
    variants: ['control', 'variant_a', 'variant_b'],
    defaultVariant: 'control',
    enabled: true,
    trafficAllocation: 100,
  },
  
  listing_card_layout: {
    id: 'listing_card_layout',
    name: 'Listing Card Layout',
    description: 'Test different listing card layouts',
    variants: ['control', 'compact', 'detailed'],
    defaultVariant: 'control',
    enabled: true,
    trafficAllocation: 100,
  },
  
  search_algorithm: {
    id: 'search_algorithm',
    name: 'Search Algorithm',
    description: 'Test semantic vs keyword search',
    variants: ['keyword', 'semantic', 'hybrid'],
    defaultVariant: 'hybrid',
    enabled: true,
    trafficAllocation: 100,
  },
};

/**
 * Feature flags configuration
 * Requirements: 30.3
 */
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  new_homepage_design: {
    id: 'new_homepage_design',
    name: 'New Homepage Design',
    description: 'Gradual rollout of new homepage design',
    enabled: true,
    rolloutPercentage: 100,
  },
  
  ai_recommendations: {
    id: 'ai_recommendations',
    name: 'AI Recommendations',
    description: 'AI-powered personalized recommendations',
    enabled: true,
    rolloutPercentage: 100,
  },
  
  video_listings: {
    id: 'video_listings',
    name: 'Video Listings',
    description: 'Support for video in listings',
    enabled: true,
    rolloutPercentage: 100,
  },
  
  live_chat: {
    id: 'live_chat',
    name: 'Live Chat',
    description: 'Real-time chat with vendors',
    enabled: false,
    rolloutPercentage: 0,
  },
};

/**
 * Get variant text for hero CTA experiment
 */
export function getHeroCTAText(variant: string): { primary: string; secondary: string } {
  switch (variant) {
    case 'variant_a':
      return {
        primary: 'Start Selling Now',
        secondary: 'Browse Listings',
      };
    case 'variant_b':
      return {
        primary: 'Join FindAm Today',
        secondary: 'Explore Marketplace',
      };
    case 'control':
    default:
      return {
        primary: 'Get Started',
        secondary: 'Browse Products',
      };
  }
}
