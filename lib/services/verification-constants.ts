/**
 * Verification Badge Constants
 *
 * Shared constants for verification badges that can be safely imported
 * in both client and server components.
 *
 * Requirements: 15.2, 15.4, 15.5
 */

export type BadgeTier = "none" | "basic" | "trusted" | "power";

export interface BadgeCriteria {
  basic: {
    phone: boolean;
    nin: boolean;
    video: boolean;
  };
  trusted: {
    transactions: number;
    minRating: number;
  };
  power: {
    transactions: number;
    minRating: number;
  };
}

/**
 * Badge criteria constants
 * Requirement 15.2, 15.4, 15.5
 */
export const BADGE_CRITERIA: BadgeCriteria = {
  basic: {
    phone: true,
    nin: true,
    video: true,
  },
  trusted: {
    transactions: 10,
    minRating: 4.5,
  },
  power: {
    transactions: 50,
    minRating: 4.8,
  },
};
