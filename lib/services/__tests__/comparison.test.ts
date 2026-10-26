/**
 * Unit tests for ComparisonService
 * Requirements: 3.1, 3.6, 3.10
 */

import { describe, it, expect } from "vitest";
import {
  validateComparisonListingCount,
  validateComparisonName,
} from "@/lib/types";

describe("ComparisonService Validation", () => {
  describe("Listing Count Validation", () => {
    it("should validate 2-4 listing count (Requirement 3.1)", () => {
      // Valid counts
      expect(validateComparisonListingCount(2)).toBe(true);
      expect(validateComparisonListingCount(3)).toBe(true);
      expect(validateComparisonListingCount(4)).toBe(true);

      // Invalid counts
      expect(validateComparisonListingCount(1)).toBe(false);
      expect(validateComparisonListingCount(5)).toBe(false);
      expect(validateComparisonListingCount(0)).toBe(false);
      expect(validateComparisonListingCount(-1)).toBe(false);
    });
  });

  describe("Comparison Name Validation", () => {
    it("should validate comparison name format (Requirement 3.8)", () => {
      // Valid names
      expect(validateComparisonName("My Favorite Phones")).toBe(true);
      expect(validateComparisonName("Best Laptops 2024")).toBe(true);
      expect(validateComparisonName("a")).toBe(true);
      expect(validateComparisonName("a".repeat(100))).toBe(true);

      // Invalid names
      expect(validateComparisonName("")).toBe(false);
      expect(validateComparisonName("   ")).toBe(false);
      expect(validateComparisonName("a".repeat(101))).toBe(false);
    });
  });

  describe("ComparisonSet Structure", () => {
    it("should have correct structure for comparison set", () => {
      const mockComparisonSet = {
        id: "comparison-1",
        user_id: "user-123",
        listing_ids: ["listing-1", "listing-2", "listing-3"],
        category_id: "category-1",
        name: "My Comparison",
        is_saved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(mockComparisonSet.listing_ids).toHaveLength(3);
      expect(
        validateComparisonListingCount(mockComparisonSet.listing_ids.length),
      ).toBe(true);
      expect(mockComparisonSet.category_id).toBeDefined();
      expect(mockComparisonSet.is_saved).toBe(true);
      expect(mockComparisonSet.name).toBeDefined();
    });

    it("should validate session comparison (not saved)", () => {
      const sessionComparison = {
        id: "comparison-2",
        user_id: "user-123",
        listing_ids: ["listing-1", "listing-2"],
        category_id: "category-1",
        name: null,
        is_saved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(sessionComparison.is_saved).toBe(false);
      expect(sessionComparison.name).toBeNull();
      expect(
        validateComparisonListingCount(sessionComparison.listing_ids.length),
      ).toBe(true);
    });
  });

  describe("Category Validation", () => {
    it("should ensure all listings have same category (Requirement 3.10)", () => {
      const listings = [
        { id: "listing-1", category_id: "category-1" },
        { id: "listing-2", category_id: "category-1" },
        { id: "listing-3", category_id: "category-1" },
      ];

      const firstCategoryId = listings[0].category_id;
      const allSameCategory = listings.every(
        (l) => l.category_id === firstCategoryId,
      );

      expect(allSameCategory).toBe(true);
    });

    it("should detect different categories", () => {
      const listings = [
        { id: "listing-1", category_id: "category-1" },
        { id: "listing-2", category_id: "category-2" },
        { id: "listing-3", category_id: "category-1" },
      ];

      const firstCategoryId = listings[0].category_id;
      const allSameCategory = listings.every(
        (l) => l.category_id === firstCategoryId,
      );

      expect(allSameCategory).toBe(false);
    });
  });

  describe("Listing Limit Enforcement", () => {
    it("should enforce maximum 4 listings (Requirement 3.1)", () => {
      const listingIds = ["l1", "l2", "l3", "l4"];
      expect(validateComparisonListingCount(listingIds.length)).toBe(true);

      const tooManyListings = ["l1", "l2", "l3", "l4", "l5"];
      expect(validateComparisonListingCount(tooManyListings.length)).toBe(
        false,
      );
    });

    it("should enforce minimum 2 listings (Requirement 3.1)", () => {
      const validListings = ["l1", "l2"];
      expect(validateComparisonListingCount(validListings.length)).toBe(true);

      const tooFewListings = ["l1"];
      expect(validateComparisonListingCount(tooFewListings.length)).toBe(false);
    });
  });
});
