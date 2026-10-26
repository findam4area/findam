import { describe, it, expect } from "vitest";
import { createReviewSchema, updateReviewSchema } from "../review";

describe("Review Validation Schemas", () => {
  describe("createReviewSchema", () => {
    it("should validate a valid review", () => {
      const validReview = {
        reviewed_user_id: "123e4567-e89b-12d3-a456-426614174000",
        rating: 5,
        comment: "Great seller!",
      };

      const result = createReviewSchema.safeParse(validReview);
      expect(result.success).toBe(true);
    });

    it("should reject invalid rating", () => {
      const invalidReview = {
        reviewed_user_id: "123e4567-e89b-12d3-a456-426614174000",
        rating: 6,
        comment: "Great seller!",
      };

      const result = createReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
    });

    it("should reject rating below 1", () => {
      const invalidReview = {
        reviewed_user_id: "123e4567-e89b-12d3-a456-426614174000",
        rating: 0,
        comment: "Bad seller",
      };

      const result = createReviewSchema.safeParse(invalidReview);
      expect(result.success).toBe(false);
    });

    it("should sanitize comment with XSS content", () => {
      const reviewWithXss = {
        reviewed_user_id: "123e4567-e89b-12d3-a456-426614174000",
        rating: 5,
        comment: '<script>alert("xss")</script>Great seller!',
      };

      const result = createReviewSchema.safeParse(reviewWithXss);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.comment).not.toContain("<script>");
      }
    });
  });
});
