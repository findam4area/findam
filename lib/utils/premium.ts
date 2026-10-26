/**
 * Premium and Boost Utilities
 * Helper functions for premium features and listing boost management
 */

export interface UserPremiumStatus {
  is_premium: boolean;
  premium_expires_at: string | null;
  is_expired: boolean;
}

export interface ListingLimits {
  max_listings: number;
  current_listings: number;
  can_create: boolean;
}

/**
 * Check if user's premium subscription is active
 */
export function isPremiumActive(user: {
  is_premium: boolean;
  premium_expires_at: string | null;
}): boolean {
  if (!user.is_premium) {
    return false;
  }

  if (!user.premium_expires_at) {
    return false;
  }

  const expiresAt = new Date(user.premium_expires_at);
  const now = new Date();

  return expiresAt > now;
}

/**
 * Get listing limits for user based on premium status
 */
export function getListingLimits(
  isPremium: boolean,
  currentListingsCount: number,
): ListingLimits {
  const maxListings = isPremium ? 30 : 3;

  return {
    max_listings: maxListings,
    current_listings: currentListingsCount,
    can_create: currentListingsCount < maxListings,
  };
}

/**
 * Check if listing boost is active
 */
export function isBoostActive(listing: {
  is_boosted: boolean;
  boost_expires_at: string | null;
}): boolean {
  if (!listing.is_boosted) {
    return false;
  }

  if (!listing.boost_expires_at) {
    return false;
  }

  const expiresAt = new Date(listing.boost_expires_at);
  const now = new Date();

  return expiresAt > now;
}

/**
 * Calculate days remaining for boost
 */
export function getBoostDaysRemaining(boostExpiresAt: string | null): number {
  if (!boostExpiresAt) {
    return 0;
  }

  const expiresAt = new Date(boostExpiresAt);
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Calculate days remaining for premium subscription
 */
export function getPremiumDaysRemaining(
  premiumExpiresAt: string | null,
): number {
  if (!premiumExpiresAt) {
    return 0;
  }

  const expiresAt = new Date(premiumExpiresAt);
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Premium feature flags
 */
export const PREMIUM_FEATURES = {
  MAX_LISTINGS: 30,
  ANALYTICS_ACCESS: true,
  PRIORITY_SUPPORT: true,
  VERIFICATION_BADGE: true,
  FEATURED_STORIES: true,
} as const;

/**
 * Free tier feature flags
 */
export const FREE_FEATURES = {
  MAX_LISTINGS: 3,
  ANALYTICS_ACCESS: false,
  PRIORITY_SUPPORT: false,
  VERIFICATION_BADGE: false,
  FEATURED_STORIES: false,
} as const;

/**
 * Pricing constants (in Naira)
 */
export const PRICING = {
  BOOST: 500,
  PREMIUM_MONTHLY: 5999,
} as const;
