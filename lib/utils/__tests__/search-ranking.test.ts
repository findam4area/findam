/**
 * Unit tests for search ranking calculator
 * 
 * Tests Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 */

import { describe, it, expect } from "vitest";
import {
  calculateSearchScore,
  compareTiebreakers,
  rankSearchResults,
  type ScoringParams,
} from "../search-ranking";

describe("calculateSearchScore", () => {
  it("should calculate score with all components", () => {
    const params: ScoringParams = {
      textRelevanceScore: 0.8, // ts_rank from PostgreSQL
      isPrimaryCategoryMatch: true,
      isSecondaryCategoryMatch: false,
      averageRating: 4.5,
      reviewCount: 50,
      isPremium: true,
      isVerified: true,
      createdAt: new Date(), // Recent business
    };

    const score = calculateSearchScore(params);

    // Score should be sum of weighted components
    // Text: 0.8 * 0.4 = 0.32
    // Rating: (4.5/5) * 0.2 = 0.18
    // Category: 1.0 * 0.15 = 0.15
    // Premium: 0.1
    // Verified: 0.1
    // Freshness: ~0.05 (new business)
    // Total: ~0.90

    expect(score).toBeGreaterThan(0.85);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it("should give higher score to primary category match than secondary", () => {
    const baseParams: Omit<
      ScoringParams,
      "isPrimaryCategoryMatch" | "isSecondaryCategoryMatch"
    > = {
      textRelevanceScore: 0.5,
      averageRating: 4.0,
      reviewCount: 20,
      isPremium: false,
      isVerified: false,
      createdAt: new Date("2023-01-01"),
    };

    const primaryScore = calculateSearchScore({
      ...baseParams,
      isPrimaryCategoryMatch: true,
      isSecondaryCategoryMatch: false,
    });

    const secondaryScore = calculateSearchScore({
      ...baseParams,
      isPrimaryCategoryMatch: false,
      isSecondaryCategoryMatch: true,
    });

    expect(primaryScore).toBeGreaterThan(secondaryScore);
  });

  it("should boost premium businesses (Requirement 16.3)", () => {
    const baseParams: Omit<ScoringParams, "isPremium"> = {
      textRelevanceScore: 0.5,
      isPrimaryCategoryMatch: true,
      isSecondaryCategoryMatch: false,
      averageRating: 4.0,
      reviewCount: 20,
      isVerified: false,
      createdAt: new Date("2023-01-01"),
    };

    const premiumScore = calculateSearchScore({
      ...baseParams,
      isPremium: true,
    });

    const regularScore = calculateSearchScore({
      ...baseParams,
      isPremium: false,
    });

    expect(premiumScore).toBeGreaterThan(regularScore);
    expect(premiumScore - regularScore).toBeCloseTo(0.1, 2); // Premium weight
  });

  it("should boost verified businesses (Requirement 16.4)", () => {
    const baseParams: Omit<ScoringParams, "isVerified"> = {
      textRelevanceScore: 0.5,
      isPrimaryCategoryMatch: true,
      isSecondaryCategoryMatch: false,
      averageRating: 4.0,
      reviewCount: 20,
      isPremium: false,
      createdAt: new Date("2023-01-01"),
    };

    const verifiedScore = calculateSearchScore({
      ...baseParams,
      isVerified: true,
    });

    const regularScore = calculateSearchScore({
      ...baseParams,
      isVerified: false,
    });

    expect(verifiedScore).toBeGreaterThan(regularScore);
    expect(verifiedScore - regularScore).toBeCloseTo(0.1, 2); // Verification weight
  });

  it("should boost businesses with higher ratings (Requirement 16.5)", () => {
    const baseParams: Omit<ScoringParams, "averageRating"> = {
      textRelevanceScore: 0.5,
      isPrimaryCategoryMatch: true,
      isSecondaryCategoryMatch: false,
      reviewCount: 20,
      isPremium: false,
      isVerified: false,
      createdAt: new Date("2023-01-01"),
    };

    const highRatingScore = calculateSearchScore({
      ...baseParams,
      averageRating: 4.8,
    });

    const lowRatingScore = calculateSearchScore({
      ...baseParams,
      averageRating: 3.0,
    });

    expect(highRatingScore).toBeGreaterThan(lowRatingScore);
  });

  it("should give slight boost to newer businesses (freshness)", () => {
    const baseParams: Omit<ScoringParams, "createdAt"> = {
      textRelevanceScore: 0.5,
      isPrimaryCategoryMatch: true,
      isSecondaryCategoryMatch: false,
      averageRating: 4.0,
      reviewCount: 20,
      isPremium: false,
      isVerified: false,
    };

    const newBusinessScore = calculateSearchScore({
      ...baseParams,
      createdAt: new Date(), // Today
    });

    const oldBusinessScore = calculateSearchScore({
      ...baseParams,
      createdAt: new Date("2022-01-01"), // 2 years ago
    });

    expect(newBusinessScore).toBeGreaterThan(oldBusinessScore);
  });

  it("should handle zero ratings correctly", () => {
    const params: ScoringParams = {
      textRelevanceScore: 0.5,
      isPrimaryCategoryMatch: true,
      isSecondaryCategoryMatch: false,
      averageRating: 0,
      reviewCount: 0,
      isPremium: false,
      isVerified: false,
      createdAt: new Date(),
    };

    const score = calculateSearchScore(params);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it("should clamp score to [0, 1] range", () => {
    const params: ScoringParams = {
      textRelevanceScore: 1.0,
      isPrimaryCategoryMatch: true,
      isSecondaryCategoryMatch: false,
      averageRating: 5.0,
      reviewCount: 1000,
      isPremium: true,
      isVerified: true,
      createdAt: new Date(),
    };

    const score = calculateSearchScore(params);

    expect(score).toBeLessThanOrEqual(1.0);
  });
});

describe("compareTiebreakers", () => {
  it("should rank by review count when scores are equal (Requirement 16.6)", () => {
    const a = {
      review_count: 100,
      view_count: 500,
      created_at: "2023-01-01",
    };

    const b = {
      review_count: 50,
      view_count: 500,
      created_at: "2023-01-01",
    };

    const result = compareTiebreakers(a, b);

    expect(result).toBeLessThan(0); // a should rank higher
  });

  it("should rank by view count when review counts are equal", () => {
    const a = {
      review_count: 50,
      view_count: 1000,
      created_at: "2023-01-01",
    };

    const b = {
      review_count: 50,
      view_count: 500,
      created_at: "2023-01-01",
    };

    const result = compareTiebreakers(a, b);

    expect(result).toBeLessThan(0); // a should rank higher
  });

  it("should rank by created date when review and view counts are equal", () => {
    const a = {
      review_count: 50,
      view_count: 500,
      created_at: "2024-01-01", // Newer
    };

    const b = {
      review_count: 50,
      view_count: 500,
      created_at: "2023-01-01", // Older
    };

    const result = compareTiebreakers(a, b);

    expect(result).toBeLessThan(0); // a (newer) should rank higher
  });

  it("should return 0 when all tiebreakers are equal", () => {
    const a = {
      review_count: 50,
      view_count: 500,
      created_at: "2023-01-01",
    };

    const b = {
      review_count: 50,
      view_count: 500,
      created_at: "2023-01-01",
    };

    const result = compareTiebreakers(a, b);

    expect(result).toBe(0);
  });
});

describe("rankSearchResults", () => {
  it("should sort by search score descending", () => {
    const results = [
      {
        id: "1",
        searchScore: 0.5,
        review_count: 10,
        view_count: 100,
        created_at: "2023-01-01",
      },
      {
        id: "2",
        searchScore: 0.9,
        review_count: 20,
        view_count: 200,
        created_at: "2023-01-01",
      },
      {
        id: "3",
        searchScore: 0.7,
        review_count: 15,
        view_count: 150,
        created_at: "2023-01-01",
      },
    ];

    const ranked = rankSearchResults(results);

    expect(ranked[0].id).toBe("2"); // Highest score
    expect(ranked[1].id).toBe("3"); // Middle score
    expect(ranked[2].id).toBe("1"); // Lowest score
  });

  it("should apply tiebreakers when scores are equal", () => {
    const results = [
      {
        id: "1",
        searchScore: 0.8,
        review_count: 50,
        view_count: 100,
        created_at: "2023-01-01",
      },
      {
        id: "2",
        searchScore: 0.8,
        review_count: 100, // More reviews (should rank higher)
        view_count: 100,
        created_at: "2023-01-01",
      },
      {
        id: "3",
        searchScore: 0.8,
        review_count: 75,
        view_count: 100,
        created_at: "2023-01-01",
      },
    ];

    const ranked = rankSearchResults(results);

    expect(ranked[0].id).toBe("2"); // Most reviews
    expect(ranked[1].id).toBe("3"); // Middle reviews
    expect(ranked[2].id).toBe("1"); // Least reviews
  });

  it("should handle empty array", () => {
    const results: any[] = [];
    const ranked = rankSearchResults(results);

    expect(ranked).toEqual([]);
  });

  it("should handle single result", () => {
    const results = [
      {
        id: "1",
        searchScore: 0.8,
        review_count: 50,
        view_count: 100,
        created_at: "2023-01-01",
      },
    ];

    const ranked = rankSearchResults(results);

    expect(ranked.length).toBe(1);
    expect(ranked[0].id).toBe("1");
  });
});
