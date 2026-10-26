import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { createReviewSchema, updateReviewSchema } from "../review";

/**
 * Property-Based Tests for Review Validation
 * 
 * These tests verify universal properties that should hold for all review data,
 * using fast-check to generate hundreds of test cases automatically.
 */

describe("Review Validation - Property-Based Tests", () => {
  /**
   * Property 13: Review Rating Range Invariant
   * **Validates: Requirements 25.11**
   * 
   * For any review, the rating value SHALL be an integer between 1 and 5 inclusive.
   */
  describe("Property 13: Review Rating Range Invariant", () => {
    it("should accept all valid ratings (1-5)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.uuid(),
          fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
          (rating, userId, comment) => {
            const review = {
              reviewed_user_id: userId,
              rating,
              comment,
            };

            const result = createReviewSchema.safeParse(review);
            
            // All ratings between 1 and 5 should be valid
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.rating).toBeGreaterThanOrEqual(1);
              expect(result.data.rating).toBeLessThanOrEqual(5);
              expect(Number.isInteger(result.data.rating)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject all ratings outside 1-5 range", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ max: 0 }), // Below minimum
            fc.integer({ min: 6 })  // Above maximum
          ),
          fc.uuid(),
          (rating, userId) => {
            const review = {
              reviewed_user_id: userId,
              rating,
              comment: "Test comment",
            };

            const result = createReviewSchema.safeParse(review);
            
            // All ratings outside 1-5 should be rejected
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject non-integer ratings", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 5, noNaN: true }).filter(n => !Number.isInteger(n)),
          fc.uuid(),
          (rating, userId) => {
            const review = {
              reviewed_user_id: userId,
              rating,
              comment: "Test comment",
            };

            const result = createReviewSchema.safeParse(review);
            
            // Non-integer ratings should be rejected
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should maintain rating invariant through update operations", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.option(fc.string({ maxLength: 1000 }), { nil: null }),
          (rating, comment) => {
            const update = {
              rating,
              comment,
            };

            const result = updateReviewSchema.safeParse(update);
            
            // Update operations should maintain the same rating constraints
            if (result.success && result.data.rating !== undefined) {
              expect(result.data.rating).toBeGreaterThanOrEqual(1);
              expect(result.data.rating).toBeLessThanOrEqual(5);
              expect(Number.isInteger(result.data.rating)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Comment length constraint
   * Ensures comments never exceed maximum length
   */
  describe("Property: Comment Length Constraint", () => {
    it("should accept comments up to 1000 characters", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.uuid(),
          fc.string({ maxLength: 1000 }),
          (rating, userId, comment) => {
            const review = {
              reviewed_user_id: userId,
              rating,
              comment,
            };

            const result = createReviewSchema.safeParse(review);
            
            expect(result.success).toBe(true);
            if (result.success && result.data.comment) {
              expect(result.data.comment.length).toBeLessThanOrEqual(1000);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject comments exceeding 1000 characters", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.uuid(),
          fc.string({ minLength: 1001, maxLength: 2000 }),
          (rating, userId, comment) => {
            const review = {
              reviewed_user_id: userId,
              rating,
              comment,
            };

            const result = createReviewSchema.safeParse(review);
            
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional property: Image array constraint
   * Ensures image arrays never exceed maximum count
   */
  describe("Property: Image Array Constraint", () => {
    it("should accept up to 5 images", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.uuid(),
          fc.array(fc.webUrl(), { maxLength: 5 }),
          (rating, userId, images) => {
            const review = {
              reviewed_user_id: userId,
              rating,
              images,
            };

            const result = createReviewSchema.safeParse(review);
            
            expect(result.success).toBe(true);
            if (result.success && result.data.images) {
              expect(result.data.images.length).toBeLessThanOrEqual(5);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject more than 5 images", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.uuid(),
          fc.array(fc.webUrl(), { minLength: 6, maxLength: 10 }),
          (rating, userId, images) => {
            const review = {
              reviewed_user_id: userId,
              rating,
              images,
            };

            const result = createReviewSchema.safeParse(review);
            
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional property: UUID validation
   * Ensures user IDs are valid UUIDs
   */
  describe("Property: UUID Validation", () => {
    it("should accept valid UUIDs for reviewed_user_id", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.uuid(),
          (rating, userId) => {
            const review = {
              reviewed_user_id: userId,
              rating,
            };

            const result = createReviewSchema.safeParse(review);
            
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject invalid UUIDs for reviewed_user_id", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.string().filter(s => !s.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)),
          (rating, invalidUserId) => {
            const review = {
              reviewed_user_id: invalidUserId,
              rating,
            };

            const result = createReviewSchema.safeParse(review);
            
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: XSS sanitization
   * Ensures all comments are sanitized (HTML-encoded for safety)
   */
  describe("Property: XSS Sanitization", () => {
    it("should HTML-encode all comments containing HTML/script tags", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.uuid(),
          fc.string({ maxLength: 500 }),
          (rating, userId, baseComment) => {
            // Inject various XSS patterns
            const xssPatterns = [
              `<script>${baseComment}</script>`,
              `<img src=x onerror="${baseComment}">`,
              `<iframe>${baseComment}</iframe>`,
              `<object>${baseComment}</object>`,
            ];

            for (const comment of xssPatterns) {
              const review = {
                reviewed_user_id: userId,
                rating,
                comment,
              };

              const result = createReviewSchema.safeParse(review);
              
              if (result.success && result.data.comment) {
                // Sanitized comment should have HTML entities encoded
                // This makes the content safe to display without executing scripts
                expect(result.data.comment).not.toContain("<script");
                expect(result.data.comment).not.toContain("<iframe");
                // HTML entities should be encoded (< becomes &lt;, > becomes &gt;)
                if (comment.includes("<")) {
                  expect(result.data.comment).toContain("&lt;");
                }
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
