/**
 * Search Ranking Calculator
 * 
 * Implements the weighted scoring algorithm for business search results
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 */

import { BusinessProfile } from "../types/business-profile";

/**
 * Weights for different scoring components
 */
const SCORE_WEIGHTS = {
  TEXT_RELEVANCE: 0.4,
  RATING: 0.2,
  CATEGORY_MATCH: 0.15,
  PREMIUM_BOOST: 0.1,
  VERIFICATION_BOOST: 0.1,
  FRESHNESS: 0.05,
} as const;

/**
 * Scoring parameters for calculating individual components
 */
export interface ScoringParams {
  // Text relevance score from PostgreSQL ts_rank (0-1 range)
  textRelevanceScore: number;
  
  // Whether the business matches the primary category filter
  isPrimaryCategoryMatch: boolean;
  
  // Whether the business matches any secondary category filter
  isSecondaryCategoryMatch: boolean;
  
  // Business profile data
  averageRating: number;
  reviewCount: number;
  isPremium: boolean;
  isVerified: boolean;
  createdAt: Date;
}

/**
 * Calculate the overall search score for a business
 * 
 * Score components:
 * - Text relevance (0.4): Based on PostgreSQL ts_rank of full-text search
 * - Rating (0.2): Normalized average rating (0-5 stars → 0-1)
 * - Category match (0.15): 1.0 for primary match, 0.5 for secondary match
 * - Premium boost (0.1): 1.0 if premium, 0 otherwise
 * - Verification boost (0.1): 1.0 if verified, 0 otherwise
 * - Freshness (0.05): Decay based on business age (max 1.0 for new businesses)
 * 
 * @param params - Scoring parameters
 * @returns Final score between 0 and 1
 */
export function calculateSearchScore(params: ScoringParams): number {
  const {
    textRelevanceScore,
    isPrimaryCategoryMatch,
    isSecondaryCategoryMatch,
    averageRating,
    isPremium,
    isVerified,
    createdAt,
  } = params;

  // Text relevance component (already 0-1 from ts_rank)
  const textScore = textRelevanceScore * SCORE_WEIGHTS.TEXT_RELEVANCE;

  // Rating component (normalize 0-5 stars to 0-1)
  const ratingScore = (averageRating / 5.0) * SCORE_WEIGHTS.RATING;

  // Category match component
  let categoryScore = 0;
  if (isPrimaryCategoryMatch) {
    categoryScore = 1.0 * SCORE_WEIGHTS.CATEGORY_MATCH;
  } else if (isSecondaryCategoryMatch) {
    categoryScore = 0.5 * SCORE_WEIGHTS.CATEGORY_MATCH;
  }

  // Premium boost component
  const premiumScore = isPremium ? SCORE_WEIGHTS.PREMIUM_BOOST : 0;

  // Verification boost component
  const verificationScore = isVerified ? SCORE_WEIGHTS.VERIFICATION_BOOST : 0;

  // Freshness component (exponential decay over 1 year)
  const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const daysInYear = 365;
  const freshnessScore = Math.exp(-ageInDays / daysInYear) * SCORE_WEIGHTS.FRESHNESS;

  // Calculate total score
  const totalScore =
    textScore +
    ratingScore +
    categoryScore +
    premiumScore +
    verificationScore +
    freshnessScore;

  // Clamp to [0, 1] range (should already be in range but ensure it)
  return Math.max(0, Math.min(1, totalScore));
}

/**
 * Tiebreaker comparison for businesses with identical search scores
 * 
 * Tiebreaker order:
 * 1. Review count (more reviews rank higher)
 * 2. View count (more views rank higher)
 * 3. Created date (newer businesses rank higher)
 * 
 * @param a - First business
 * @param b - Second business
 * @returns Negative if a ranks higher, positive if b ranks higher, 0 if equal
 */
export function compareTiebreakers(
  a: {
    review_count: number;
    view_count: number;
    created_at: string | Date;
  },
  b: {
    review_count: number;
    view_count: number;
    created_at: string | Date;
  }
): number {
  // Compare by review count (descending)
  if (a.review_count !== b.review_count) {
    return b.review_count - a.review_count;
  }

  // Compare by view count (descending)
  if (a.view_count !== b.view_count) {
    return b.view_count - a.view_count;
  }

  // Compare by created date (descending - newer first)
  const dateA =
    typeof a.created_at === "string" ? new Date(a.created_at) : a.created_at;
  const dateB =
    typeof b.created_at === "string" ? new Date(b.created_at) : b.created_at;

  return dateB.getTime() - dateA.getTime();
}

/**
 * Combine search results with their scores and apply tiebreakers
 * 
 * @param results - Array of business results with their search scores
 * @returns Sorted array of results
 */
export function rankSearchResults<T extends { 
  review_count: number; 
  view_count: number; 
  created_at: string | Date;
  searchScore: number;
}>(results: T[]): T[] {
  return results.sort((a, b) => {
    // First compare by search score (descending)
    if (Math.abs(a.searchScore - b.searchScore) > 0.0001) {
      return b.searchScore - a.searchScore;
    }

    // If scores are essentially equal, use tiebreakers
    return compareTiebreakers(a, b);
  });
}
