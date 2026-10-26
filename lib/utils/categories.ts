import type { Category as CategoryFromCore } from "@/lib/types/core";

/**
 * Badge types for category display
 */
export interface CategoryBadges {
  isPopular: boolean;
  isRecentlyUpdated: boolean;
  isNew: boolean;
  subcategoryCount: number;
}

/**
 * Configuration for badge thresholds
 */
export interface BadgeThresholds {
  popularThreshold: number; // listing_count > this value
  recentDays: number; // updated within this many days
  newDays: number; // created within this many days
}

const DEFAULT_THRESHOLDS: BadgeThresholds = {
  popularThreshold: 100,
  recentDays: 7,
  newDays: 30,
};

/**
 * Flexible category interface for badge calculation
 * Accepts both core.ts and category.ts Category types
 */
interface CategoryForBadges {
  listing_count?: number;
  business_count?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Calculate category badges based on category data
 * 
 * Badge logic:
 * - "Popular": listing_count > 100
 * - "Recently Updated": updated within 7 days
 * - "New": created within 30 days
 * - Subcategory count: number of direct children (passed separately)
 * 
 * Requirements: 1.4, 4.2, 4.3, 4.5
 * 
 * @param category - The category to evaluate (accepts both Category types)
 * @param subcategoryCount - Number of direct subcategories (default: 0)
 * @param thresholds - Custom threshold values (optional)
 * @returns CategoryBadges object with boolean flags for each badge
 */
export function getCategoryBadges(
  category: CategoryForBadges,
  subcategoryCount: number = 0,
  thresholds: Partial<BadgeThresholds> = {}
): CategoryBadges {
  const config = { ...DEFAULT_THRESHOLDS, ...thresholds };
  
  const now = new Date();
  
  // Parse dates - handle potential invalid dates gracefully
  const createdAt = category.created_at ? new Date(category.created_at) : null;
  const updatedAt = category.updated_at ? new Date(category.updated_at) : null;
  
  // Check if dates are valid
  const isValidDate = (date: Date | null): date is Date => {
    return date !== null && !isNaN(date.getTime());
  };
  
  // Calculate days since date
  const getDaysSince = (date: Date): number => {
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Popular badge: listing_count > 100 (check both naming conventions)
  const listingCount = category.listing_count ?? category.business_count ?? 0;
  const isPopular = listingCount > config.popularThreshold;
  
  // Recently Updated badge: updated within 7 days
  let isRecentlyUpdated = false;
  if (isValidDate(updatedAt)) {
    const daysSinceUpdate = getDaysSince(updatedAt);
    isRecentlyUpdated = daysSinceUpdate < config.recentDays;
  }
  
  // New badge: created within 30 days
  let isNew = false;
  if (isValidDate(createdAt)) {
    const daysSinceCreated = getDaysSince(createdAt);
    isNew = daysSinceCreated < config.newDays;
  }
  
  return {
    isPopular,
    isRecentlyUpdated,
    isNew,
    subcategoryCount,
  };
}
