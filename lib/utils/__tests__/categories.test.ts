import { describe, it, expect } from "vitest";
import { getCategoryBadges } from "../categories";

/**
 * Unit Tests: getCategoryBadges utility function
 * 
 * Tests badge logic for category cards:
 * - "Popular" badge when listing_count > 100
 * - "Recently Updated" badge when updated within 7 days
 * - "New" badge when created within 30 days
 * - Subcategory count indicator
 * 
 * Requirements: 1.4, 4.2, 4.3, 4.5
 * Property 11: Badge Logic Correctness
 */

describe("getCategoryBadges", () => {
  const now = new Date();

  describe("Popular badge logic", () => {
    it("should mark category as popular when listing_count > 100", () => {
      const category = {
        listing_count: 150,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isPopular).toBe(true);
    });

    it("should not mark category as popular when listing_count = 100", () => {
      const category = {
        listing_count: 100,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isPopular).toBe(false);
    });

    it("should not mark category as popular when listing_count < 100", () => {
      const category = {
        listing_count: 50,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isPopular).toBe(false);
    });

    it("should not mark category as popular when listing_count is 0", () => {
      const category = {
        listing_count: 0,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isPopular).toBe(false);
    });

    it("should handle business_count fallback for popularity", () => {
      const category = {
        business_count: 150,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isPopular).toBe(true);
    });
  });

  describe("Recently Updated badge logic", () => {
    it("should mark category as recently updated when updated within 7 days", () => {
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const category = {
        listing_count: 50,
        created_at: "2023-01-01",
        updated_at: fiveDaysAgo.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isRecentlyUpdated).toBe(true);
    });

    it("should not mark category as recently updated when updated exactly 7 days ago", () => {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const category = {
        listing_count: 50,
        created_at: "2023-01-01",
        updated_at: sevenDaysAgo.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isRecentlyUpdated).toBe(false);
    });

    it("should not mark category as recently updated when updated more than 7 days ago", () => {
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const category = {
        listing_count: 50,
        created_at: "2023-01-01",
        updated_at: tenDaysAgo.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isRecentlyUpdated).toBe(false);
    });

    it("should not mark category as recently updated when updated_at is null", () => {
      const category = {
        listing_count: 50,
        created_at: "2023-01-01",
        updated_at: undefined,
      };

      const badges = getCategoryBadges(category);
      expect(badges.isRecentlyUpdated).toBe(false);
    });

    it("should handle invalid date strings gracefully", () => {
      const category = {
        listing_count: 50,
        created_at: "2023-01-01",
        updated_at: "invalid-date",
      };

      const badges = getCategoryBadges(category);
      expect(badges.isRecentlyUpdated).toBe(false);
    });
  });

  describe("New badge logic", () => {
    it("should mark category as new when created within 30 days", () => {
      const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
      const category = {
        listing_count: 50,
        created_at: twentyDaysAgo.toISOString(),
        updated_at: twentyDaysAgo.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isNew).toBe(true);
    });

    it("should not mark category as new when created exactly 30 days ago", () => {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const category = {
        listing_count: 50,
        created_at: thirtyDaysAgo.toISOString(),
        updated_at: thirtyDaysAgo.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isNew).toBe(false);
    });

    it("should not mark category as new when created more than 30 days ago", () => {
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const category = {
        listing_count: 50,
        created_at: sixtyDaysAgo.toISOString(),
        updated_at: sixtyDaysAgo.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isNew).toBe(false);
    });

    it("should not mark category as new when created_at is null", () => {
      const category = {
        listing_count: 50,
        created_at: undefined,
        updated_at: now.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isNew).toBe(false);
    });

    it("should handle invalid date strings gracefully", () => {
      const category = {
        listing_count: 50,
        created_at: "invalid-date",
        updated_at: now.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isNew).toBe(false);
    });
  });

  describe("Subcategory count", () => {
    it("should include subcategory count when provided", () => {
      const category = {
        listing_count: 50,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const badges = getCategoryBadges(category, 5);
      expect(badges.subcategoryCount).toBe(5);
    });

    it("should default to 0 when subcategory count not provided", () => {
      const category = {
        listing_count: 50,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.subcategoryCount).toBe(0);
    });

    it("should handle zero subcategories", () => {
      const category = {
        listing_count: 50,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const badges = getCategoryBadges(category, 0);
      expect(badges.subcategoryCount).toBe(0);
    });
  });

  describe("No badges scenario", () => {
    it("should return all false badges when no conditions are met", () => {
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const category = {
        listing_count: 50, // Not popular (≤ 100)
        created_at: sixtyDaysAgo.toISOString(), // Not new (> 30 days)
        updated_at: sixtyDaysAgo.toISOString(), // Not recently updated (> 7 days)
      };

      const badges = getCategoryBadges(category);
      expect(badges.isPopular).toBe(false);
      expect(badges.isRecentlyUpdated).toBe(false);
      expect(badges.isNew).toBe(false);
      expect(badges.subcategoryCount).toBe(0);
    });
  });

  describe("Multiple badges scenario", () => {
    it("should allow multiple badges to be true simultaneously", () => {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const category = {
        listing_count: 150, // Popular
        created_at: threeDaysAgo.toISOString(), // New
        updated_at: threeDaysAgo.toISOString(), // Recently updated
      };

      const badges = getCategoryBadges(category, 10);
      expect(badges.isPopular).toBe(true);
      expect(badges.isRecentlyUpdated).toBe(true);
      expect(badges.isNew).toBe(true);
      expect(badges.subcategoryCount).toBe(10);
    });
  });

  describe("Custom thresholds", () => {
    it("should respect custom popular threshold", () => {
      const category = {
        listing_count: 60,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const badges = getCategoryBadges(category, 0, { popularThreshold: 50 });
      expect(badges.isPopular).toBe(true);
    });

    it("should respect custom recent days threshold", () => {
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const category = {
        listing_count: 50,
        created_at: "2023-01-01",
        updated_at: tenDaysAgo.toISOString(),
      };

      const badges = getCategoryBadges(category, 0, { recentDays: 14 });
      expect(badges.isRecentlyUpdated).toBe(true);
    });

    it("should respect custom new days threshold", () => {
      const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
      const category = {
        listing_count: 50,
        created_at: fortyDaysAgo.toISOString(),
        updated_at: fortyDaysAgo.toISOString(),
      };

      const badges = getCategoryBadges(category, 0, { newDays: 60 });
      expect(badges.isNew).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle missing all date fields", () => {
      const category = {
        listing_count: 50,
      };

      const badges = getCategoryBadges(category);
      expect(badges.isPopular).toBe(false);
      expect(badges.isRecentlyUpdated).toBe(false);
      expect(badges.isNew).toBe(false);
    });

    it("should handle negative listing count", () => {
      const category = {
        listing_count: -10,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const badges = getCategoryBadges(category);
      expect(badges.isPopular).toBe(false);
    });

    it("should handle empty object", () => {
      const category = {};

      const badges = getCategoryBadges(category);
      expect(badges.isPopular).toBe(false);
      expect(badges.isRecentlyUpdated).toBe(false);
      expect(badges.isNew).toBe(false);
      expect(badges.subcategoryCount).toBe(0);
    });
  });
});
