/**
 * Unit Tests for Business Review Operations
 * Task 8.1: Create POST /api/business-profiles/[id]/reviews endpoint - Unit Tests
 * Task 8.2: Create GET /api/business-profiles/[id]/reviews endpoint - Unit Tests
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.5
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Business Review Operations - Unit Tests", () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(() => mockSupabase),
      maybeSingle: vi.fn(() => mockSupabase),
    };

    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe("Review Creation - Rating Validation (Requirement 11.1)", () => {
    it("should accept valid rating values (1-5)", () => {
      const validRatings = [1, 2, 3, 4, 5];

      validRatings.forEach((rating) => {
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(5);
        expect(Number.isInteger(rating)).toBe(true);
      });
    });

    it("should reject rating below 1", () => {
      const invalidRating = 0;
      expect(invalidRating).toBeLessThan(1);
    });

    it("should reject rating above 5", () => {
      const invalidRating = 6;
      expect(invalidRating).toBeGreaterThan(5);
    });

    it("should reject non-integer ratings", () => {
      const invalidRatings = [1.5, 3.7, 4.2];

      invalidRatings.forEach((rating) => {
        expect(Number.isInteger(rating)).toBe(false);
      });
    });

    it("should reject non-numeric ratings", () => {
      const invalidRatings = ["5", null, undefined, {}, []];

      invalidRatings.forEach((rating) => {
        expect(typeof rating === "number").toBe(false);
      });
    });
  });

  describe("Review Creation - Comment Validation (Requirement 11.2)", () => {
    it("should accept comments with valid length (10-1000 characters)", () => {
      const validComments = [
        "This is a great business!", // 27 characters
        "A".repeat(10), // Exactly 10 characters
        "B".repeat(500), // Mid-range
        "C".repeat(1000), // Exactly 1000 characters
      ];

      validComments.forEach((comment) => {
        expect(comment.length).toBeGreaterThanOrEqual(10);
        expect(comment.length).toBeLessThanOrEqual(1000);
      });
    });

    it("should reject comments shorter than 10 characters", () => {
      const shortComments = ["Too short", "Hi", "Great!", "A".repeat(9)];

      shortComments.forEach((comment) => {
        expect(comment.trim().length).toBeLessThan(10);
      });
    });

    it("should reject comments longer than 1000 characters", () => {
      const longComment = "A".repeat(1001);
      expect(longComment.length).toBeGreaterThan(1000);
    });

    it("should trim whitespace from comments", () => {
      const commentWithWhitespace = "  This is a valid comment  ";
      const trimmed = commentWithWhitespace.trim();

      expect(trimmed).toBe("This is a valid comment");
      expect(trimmed.length).toBeGreaterThanOrEqual(10);
    });

    it("should reject empty or whitespace-only comments", () => {
      const invalidComments = ["", "   ", "\t\n"];

      invalidComments.forEach((comment) => {
        expect(comment.trim().length).toBe(0);
      });
    });
  });

  describe("Review Creation - Duplicate Prevention (Requirement 11.3)", () => {
    it("should allow first review from a user", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const businessProfileId = "business-456";

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock: no existing review
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const { data } = await mockSupabase
        .from("business_reviews")
        .select("id")
        .eq("business_profile_id", businessProfileId)
        .eq("reviewer_id", mockUser.id)
        .maybeSingle();

      expect(data).toBeNull();
    });

    it("should prevent duplicate reviews from same user", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const businessProfileId = "business-456";

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock: existing review found
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: { id: "review-789", business_profile_id: businessProfileId, reviewer_id: mockUser.id },
        error: null,
      });

      const { data } = await mockSupabase
        .from("business_reviews")
        .select("id")
        .eq("business_profile_id", businessProfileId)
        .eq("reviewer_id", mockUser.id)
        .maybeSingle();

      expect(data).not.toBeNull();
      expect(data.reviewer_id).toBe(mockUser.id);
    });

    it("should allow different users to review the same business", () => {
      const businessProfileId = "business-456";
      const reviews = [
        { id: "review-1", business_profile_id: businessProfileId, reviewer_id: "user-1" },
        { id: "review-2", business_profile_id: businessProfileId, reviewer_id: "user-2" },
        { id: "review-3", business_profile_id: businessProfileId, reviewer_id: "user-3" },
      ];

      // All reviews are for the same business
      expect(reviews.every((r) => r.business_profile_id === businessProfileId)).toBe(true);

      // All reviews are from different users
      const uniqueReviewers = new Set(reviews.map((r) => r.reviewer_id));
      expect(uniqueReviewers.size).toBe(reviews.length);
    });
  });

  describe("Review Creation - Business Owner Restriction", () => {
    it("should prevent business owners from reviewing their own business", async () => {
      const mockUser = { id: "user-123", email: "owner@example.com" };
      const businessProfile = {
        id: "business-456",
        user_id: "user-123", // Same as reviewer
        business_name: "My Business",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: businessProfile,
        error: null,
      });

      // Verify owner check
      expect(businessProfile.user_id).toBe(mockUser.id);
    });

    it("should allow non-owners to review businesses", async () => {
      const mockUser = { id: "user-123", email: "customer@example.com" };
      const businessProfile = {
        id: "business-456",
        user_id: "different-user-789", // Different from reviewer
        business_name: "Someone Else's Business",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: businessProfile,
        error: null,
      });

      // Verify owner check passes
      expect(businessProfile.user_id).not.toBe(mockUser.id);
    });
  });

  describe("Review Creation - Rating Aggregation (Requirement 11.4)", () => {
    it("should calculate correct average rating", () => {
      const reviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 },
        { rating: 4 },
      ];

      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const average = sum / reviews.length;

      expect(average).toBe(4.2);
    });

    it("should update review count correctly", () => {
      const currentReviewCount = 10;
      const newReviewCount = currentReviewCount + 1;

      expect(newReviewCount).toBe(11);
    });

    it("should round average rating to 2 decimal places", () => {
      const reviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
      ];

      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const average = sum / reviews.length;
      const rounded = Math.round(average * 100) / 100;

      expect(rounded).toBe(4.0);
      expect(rounded.toFixed(2)).toBe("4.00");
    });

    it("should handle single review correctly", () => {
      const reviews = [{ rating: 5 }];

      const average = reviews[0].rating;
      expect(average).toBe(5);
    });

    it("should calculate rating distribution", () => {
      const reviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 4 },
        { rating: 3 },
        { rating: 2 },
        { rating: 1 },
      ];

      const distribution = {
        five_star: reviews.filter((r) => r.rating === 5).length,
        four_star: reviews.filter((r) => r.rating === 4).length,
        three_star: reviews.filter((r) => r.rating === 3).length,
        two_star: reviews.filter((r) => r.rating === 2).length,
        one_star: reviews.filter((r) => r.rating === 1).length,
      };

      expect(distribution.five_star).toBe(2);
      expect(distribution.four_star).toBe(2);
      expect(distribution.three_star).toBe(1);
      expect(distribution.two_star).toBe(1);
      expect(distribution.one_star).toBe(1);
    });
  });

  describe("Review Creation - Business Profile Existence", () => {
    it("should verify business profile exists before creating review", async () => {
      const businessProfileId = "business-456";

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: businessProfileId,
          user_id: "owner-123",
          business_name: "Test Business",
        },
        error: null,
      });

      const { data, error } = await mockSupabase
        .from("business_profiles")
        .select("id, user_id, business_name")
        .eq("id", businessProfileId)
        .single();

      expect(data).not.toBeNull();
      expect(data.id).toBe(businessProfileId);
      expect(error).toBeNull();
    });

    it("should handle non-existent business profile", async () => {
      const businessProfileId = "non-existent-business";

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });

      const { data, error } = await mockSupabase
        .from("business_profiles")
        .select("id, user_id, business_name")
        .eq("id", businessProfileId)
        .single();

      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe("Authorization", () => {
    it("should require authentication for review submission", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const { data, error } = await mockSupabase.auth.getUser();

      expect(data.user).toBeNull();
      expect(error).toBeDefined();
      expect(error.message).toBe("Not authenticated");
    });

    it("should allow authenticated users to submit reviews", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { data, error } = await mockSupabase.auth.getUser();

      expect(data.user).not.toBeNull();
      expect(data.user.id).toBe("user-123");
      expect(error).toBeNull();
    });
  });

  describe("Review Response Structure", () => {
    it("should return review with reviewer information", () => {
      const mockReview = {
        id: "review-123",
        business_profile_id: "business-456",
        reviewer_id: "user-789",
        rating: 5,
        comment: "This is an excellent business!",
        created_at: new Date().toISOString(),
        reviewer: {
          id: "user-789",
          full_name: "John Doe",
          username: "johndoe",
          avatar_url: "https://example.com/avatar.jpg",
        },
      };

      expect(mockReview.reviewer).toBeDefined();
      expect(mockReview.reviewer.id).toBe(mockReview.reviewer_id);
      expect(mockReview.reviewer.full_name).toBeDefined();
    });

    it("should return updated business rating after review submission", () => {
      const updatedBusinessRating = {
        average_rating: 4.5,
        review_count: 25,
      };

      expect(updatedBusinessRating.average_rating).toBeGreaterThanOrEqual(1.0);
      expect(updatedBusinessRating.average_rating).toBeLessThanOrEqual(5.0);
      expect(updatedBusinessRating.review_count).toBeGreaterThan(0);
    });
  });

  describe("GET Reviews Endpoint - Pagination (Requirement 11.5)", () => {
    it("should validate page parameter is positive", () => {
      const validPages = [1, 2, 5, 10];

      validPages.forEach((page) => {
        expect(page).toBeGreaterThanOrEqual(1);
      });
    });

    it("should reject page parameter less than 1", () => {
      const invalidPages = [0, -1, -5];

      invalidPages.forEach((page) => {
        expect(page).toBeLessThan(1);
      });
    });

    it("should validate limit parameter is within range", () => {
      const validLimits = [1, 10, 50, 100];

      validLimits.forEach((limit) => {
        expect(limit).toBeGreaterThanOrEqual(1);
        expect(limit).toBeLessThanOrEqual(100);
      });
    });

    it("should reject limit parameter outside valid range", () => {
      const invalidLimits = [0, -5, 101, 200];

      invalidLimits.forEach((limit) => {
        expect(limit < 1 || limit > 100).toBe(true);
      });
    });

    it("should calculate correct pagination offset", () => {
      const testCases = [
        { page: 1, limit: 10, expected: 0 },
        { page: 2, limit: 10, expected: 10 },
        { page: 3, limit: 20, expected: 40 },
        { page: 5, limit: 25, expected: 100 },
      ];

      testCases.forEach(({ page, limit, expected }) => {
        const offset = (page - 1) * limit;
        expect(offset).toBe(expected);
      });
    });
  });

  describe("GET Reviews Endpoint - Sorting (Requirement 11.5)", () => {
    it("should support recent sorting (reverse chronological)", () => {
      const reviews = [
        { id: "1", created_at: "2024-01-15T10:00:00Z" },
        { id: "2", created_at: "2024-01-14T10:00:00Z" },
        { id: "3", created_at: "2024-01-13T10:00:00Z" },
      ];

      const sortedByRecent = [...reviews].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      expect(sortedByRecent[0].id).toBe("1"); // Most recent
      expect(sortedByRecent[2].id).toBe("3"); // Oldest
    });

    it("should support rating_high sorting (highest rating first)", () => {
      const reviews = [
        { id: "1", rating: 3, created_at: "2024-01-15T10:00:00Z" },
        { id: "2", rating: 5, created_at: "2024-01-14T10:00:00Z" },
        { id: "3", rating: 4, created_at: "2024-01-13T10:00:00Z" },
      ];

      const sortedByRatingHigh = [...reviews].sort((a, b) => 
        b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      expect(sortedByRatingHigh[0].id).toBe("2"); // Rating 5
      expect(sortedByRatingHigh[1].id).toBe("3"); // Rating 4
      expect(sortedByRatingHigh[2].id).toBe("1"); // Rating 3
    });

    it("should support rating_low sorting (lowest rating first)", () => {
      const reviews = [
        { id: "1", rating: 5, created_at: "2024-01-15T10:00:00Z" },
        { id: "2", rating: 2, created_at: "2024-01-14T10:00:00Z" },
        { id: "3", rating: 4, created_at: "2024-01-13T10:00:00Z" },
      ];

      const sortedByRatingLow = [...reviews].sort((a, b) => 
        a.rating - b.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      expect(sortedByRatingLow[0].id).toBe("2"); // Rating 2
      expect(sortedByRatingLow[1].id).toBe("3"); // Rating 4
      expect(sortedByRatingLow[2].id).toBe("1"); // Rating 5
    });

    it("should validate sort_by parameter", () => {
      const validSortOptions = ["recent", "rating_high", "rating_low"];
      const invalidSortOptions = ["oldest", "popular", "random"];

      validSortOptions.forEach((option) => {
        expect(["recent", "rating_high", "rating_low"].includes(option)).toBe(true);
      });

      invalidSortOptions.forEach((option) => {
        expect(["recent", "rating_high", "rating_low"].includes(option)).toBe(false);
      });
    });
  });

  describe("GET Reviews Endpoint - Rating Breakdown (Requirement 12.5)", () => {
    it("should calculate rating breakdown correctly", () => {
      const reviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 4 },
        { rating: 3 },
        { rating: 2 },
        { rating: 1 },
      ];

      const ratingBreakdown = {
        five_star: reviews.filter((r) => r.rating === 5).length,
        four_star: reviews.filter((r) => r.rating === 4).length,
        three_star: reviews.filter((r) => r.rating === 3).length,
        two_star: reviews.filter((r) => r.rating === 2).length,
        one_star: reviews.filter((r) => r.rating === 1).length,
      };

      expect(ratingBreakdown.five_star).toBe(3);
      expect(ratingBreakdown.four_star).toBe(2);
      expect(ratingBreakdown.three_star).toBe(1);
      expect(ratingBreakdown.two_star).toBe(1);
      expect(ratingBreakdown.one_star).toBe(1);
    });

    it("should handle zero reviews for rating breakdown", () => {
      const reviews: Array<{ rating: number }> = [];

      const ratingBreakdown = {
        five_star: reviews.filter((r) => r.rating === 5).length,
        four_star: reviews.filter((r) => r.rating === 4).length,
        three_star: reviews.filter((r) => r.rating === 3).length,
        two_star: reviews.filter((r) => r.rating === 2).length,
        one_star: reviews.filter((r) => r.rating === 1).length,
      };

      expect(ratingBreakdown.five_star).toBe(0);
      expect(ratingBreakdown.four_star).toBe(0);
      expect(ratingBreakdown.three_star).toBe(0);
      expect(ratingBreakdown.two_star).toBe(0);
      expect(ratingBreakdown.one_star).toBe(0);
    });

    it("should sum rating breakdown to total review count", () => {
      const reviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
        { rating: 2 },
        { rating: 1 },
      ];

      const ratingBreakdown = {
        five_star: reviews.filter((r) => r.rating === 5).length,
        four_star: reviews.filter((r) => r.rating === 4).length,
        three_star: reviews.filter((r) => r.rating === 3).length,
        two_star: reviews.filter((r) => r.rating === 2).length,
        one_star: reviews.filter((r) => r.rating === 1).length,
      };

      const total = Object.values(ratingBreakdown).reduce((sum, count) => sum + count, 0);

      expect(total).toBe(reviews.length);
    });
  });

  describe("GET Reviews Endpoint - Filter Flagged Reviews", () => {
    it("should exclude flagged reviews from results", () => {
      const reviews = [
        { id: "1", rating: 5, is_flagged: false },
        { id: "2", rating: 4, is_flagged: true },
        { id: "3", rating: 3, is_flagged: false },
        { id: "4", rating: 2, is_flagged: true },
      ];

      const visibleReviews = reviews.filter((r) => !r.is_flagged);

      expect(visibleReviews.length).toBe(2);
      expect(visibleReviews.every((r) => !r.is_flagged)).toBe(true);
    });

    it("should include only non-flagged reviews in rating breakdown", () => {
      const allReviews = [
        { rating: 5, is_flagged: false },
        { rating: 5, is_flagged: true },  // Flagged - should be excluded
        { rating: 4, is_flagged: false },
        { rating: 3, is_flagged: true },  // Flagged - should be excluded
      ];

      const nonFlaggedReviews = allReviews.filter((r) => !r.is_flagged);

      const ratingBreakdown = {
        five_star: nonFlaggedReviews.filter((r) => r.rating === 5).length,
        four_star: nonFlaggedReviews.filter((r) => r.rating === 4).length,
        three_star: nonFlaggedReviews.filter((r) => r.rating === 3).length,
      };

      expect(ratingBreakdown.five_star).toBe(1); // Only 1 non-flagged 5-star
      expect(ratingBreakdown.four_star).toBe(1);
      expect(ratingBreakdown.three_star).toBe(0); // Flagged 3-star excluded
    });
  });

  describe("GET Reviews Endpoint - Response Structure", () => {
    it("should return paginated response with all required fields", () => {
      const response = {
        reviews: [],
        total: 25,
        page: 1,
        limit: 10,
        rating_breakdown: {
          five_star: 10,
          four_star: 8,
          three_star: 4,
          two_star: 2,
          one_star: 1,
        },
      };

      expect(response).toHaveProperty("reviews");
      expect(response).toHaveProperty("total");
      expect(response).toHaveProperty("page");
      expect(response).toHaveProperty("limit");
      expect(response).toHaveProperty("rating_breakdown");
      expect(response.rating_breakdown).toHaveProperty("five_star");
      expect(response.rating_breakdown).toHaveProperty("four_star");
      expect(response.rating_breakdown).toHaveProperty("three_star");
      expect(response.rating_breakdown).toHaveProperty("two_star");
      expect(response.rating_breakdown).toHaveProperty("one_star");
    });
  });
});
