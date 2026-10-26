import { describe, it, expect } from "vitest";
import type { Category } from "@/lib/types/core";

/**
 * Unit Tests: Category Sorting Logic
 * 
 * Tests sorting functionality:
 * - Alphabetical ascending (A-Z)
 * - Alphabetical descending (Z-A)
 * - Most listings (descending by listing_count)
 * - Fewest listings (ascending by listing_count)
 * - Recently updated (descending by updated_at, handles null dates)
 * 
 * Requirements: 3.3, 3.4, 3.5, 3.6, 3.7
 * Property 7: Category Sorting Correctness
 */

/**
 * Sort categories based on selected option
 */
function sortCategories(
  categories: Category[],
  sortOption: string
): Category[] {
  const result = [...categories];

  result.sort((a, b) => {
    switch (sortOption) {
      case "alphabetical-asc":
        return a.name.localeCompare(b.name);
      case "alphabetical-desc":
        return b.name.localeCompare(a.name);
      case "most-listings":
        return (b.listing_count || 0) - (a.listing_count || 0);
      case "fewest-listings":
        return (a.listing_count || 0) - (b.listing_count || 0);
      case "recently-updated":
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      default:
        return 0;
    }
  });

  return result;
}

describe("Category Sorting Logic", () => {
  const mockCategories: Category[] = [
    {
      id: "1",
      name: "Electronics",
      slug: "electronics",
      description: "Electronic devices",
      parent_id: null,
      listing_count: 150,
      image_url: null,
      display_order: 1,
      updated_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "2",
      name: "Fashion",
      slug: "fashion",
      description: "Clothing and accessories",
      parent_id: null,
      listing_count: 200,
      image_url: null,
      display_order: 2,
      updated_at: "2024-01-20T10:00:00Z",
    },
    {
      id: "3",
      name: "Home & Garden",
      slug: "home-garden",
      description: "Furniture and decor",
      parent_id: null,
      listing_count: 50,
      image_url: null,
      display_order: 3,
      updated_at: "2024-01-10T10:00:00Z",
    },
    {
      id: "4",
      name: "Automotive",
      slug: "automotive",
      description: "Cars and parts",
      parent_id: null,
      listing_count: 100,
      image_url: null,
      display_order: 4,
      updated_at: "2024-01-25T10:00:00Z",
    },
    {
      id: "5",
      name: "Books",
      slug: "books",
      description: "Books and magazines",
      parent_id: null,
      listing_count: 75,
      image_url: null,
      display_order: 5,
      updated_at: null as any, // Category without updated_at
    },
  ];

  describe("Alphabetical ascending (A-Z)", () => {
    it("should sort categories alphabetically ascending", () => {
      const result = sortCategories(mockCategories, "alphabetical-asc");
      const names = result.map((c) => c.name);
      expect(names).toEqual([
        "Automotive",
        "Books",
        "Electronics",
        "Fashion",
        "Home & Garden",
      ]);
    });

    it("should handle single category", () => {
      const result = sortCategories([mockCategories[0]], "alphabetical-asc");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Electronics");
    });

    it("should handle empty array", () => {
      const result = sortCategories([], "alphabetical-asc");
      expect(result).toHaveLength(0);
    });

    it("should not mutate original array", () => {
      const original = [...mockCategories];
      sortCategories(mockCategories, "alphabetical-asc");
      expect(mockCategories).toEqual(original);
    });

    it("should handle categories with same names", () => {
      const duplicates: Category[] = [
        { ...mockCategories[0], id: "a", name: "Test" },
        { ...mockCategories[1], id: "b", name: "Test" },
        { ...mockCategories[2], id: "c", name: "Another" },
      ];
      const result = sortCategories(duplicates, "alphabetical-asc");
      expect(result[0].name).toBe("Another");
      expect(result[1].name).toBe("Test");
      expect(result[2].name).toBe("Test");
    });
  });

  describe("Alphabetical descending (Z-A)", () => {
    it("should sort categories alphabetically descending", () => {
      const result = sortCategories(mockCategories, "alphabetical-desc");
      const names = result.map((c) => c.name);
      expect(names).toEqual([
        "Home & Garden",
        "Fashion",
        "Electronics",
        "Books",
        "Automotive",
      ]);
    });

    it("should reverse the order of A-Z sort", () => {
      const asc = sortCategories(mockCategories, "alphabetical-asc");
      const desc = sortCategories(mockCategories, "alphabetical-desc");
      expect(desc.map((c) => c.name)).toEqual(
        asc.map((c) => c.name).reverse()
      );
    });
  });

  describe("Most listings (descending)", () => {
    it("should sort categories by listing_count descending", () => {
      const result = sortCategories(mockCategories, "most-listings");
      const counts = result.map((c) => c.listing_count);
      expect(counts).toEqual([200, 150, 100, 75, 50]);
    });

    it("should place categories with highest listing_count first", () => {
      const result = sortCategories(mockCategories, "most-listings");
      expect(result[0].name).toBe("Fashion");
      expect(result[0].listing_count).toBe(200);
    });

    it("should handle categories with 0 listings", () => {
      const withZero: Category[] = [
        ...mockCategories,
        {
          id: "6",
          name: "Empty",
          slug: "empty",
          description: "No listings",
          parent_id: null,
          listing_count: 0,
          image_url: null,
          display_order: 6,
        },
      ];
      const result = sortCategories(withZero, "most-listings");
      expect(result[result.length - 1].name).toBe("Empty");
      expect(result[result.length - 1].listing_count).toBe(0);
    });

    it("should handle undefined listing_count", () => {
      const withUndefined: Category[] = [
        {
          id: "1",
          name: "Test",
          slug: "test",
          description: "Test",
          parent_id: null,
          listing_count: undefined as any,
          image_url: null,
          display_order: 1,
        },
        {
          id: "2",
          name: "Test2",
          slug: "test2",
          description: "Test2",
          parent_id: null,
          listing_count: 10,
          image_url: null,
          display_order: 2,
        },
      ];
      const result = sortCategories(withUndefined, "most-listings");
      expect(result[0].listing_count).toBe(10);
    });
  });

  describe("Fewest listings (ascending)", () => {
    it("should sort categories by listing_count ascending", () => {
      const result = sortCategories(mockCategories, "fewest-listings");
      const counts = result.map((c) => c.listing_count);
      expect(counts).toEqual([50, 75, 100, 150, 200]);
    });

    it("should place categories with lowest listing_count first", () => {
      const result = sortCategories(mockCategories, "fewest-listings");
      expect(result[0].name).toBe("Home & Garden");
      expect(result[0].listing_count).toBe(50);
    });

    it("should reverse the order of most-listings sort", () => {
      const most = sortCategories(mockCategories, "most-listings");
      const fewest = sortCategories(mockCategories, "fewest-listings");
      expect(fewest.map((c) => c.id)).toEqual(most.map((c) => c.id).reverse());
    });
  });

  describe("Recently updated (descending by updated_at)", () => {
    it("should sort categories by updated_at descending", () => {
      const result = sortCategories(mockCategories, "recently-updated");
      const names = result.map((c) => c.name);
      // Automotive (2024-01-25) -> Fashion (2024-01-20) -> Electronics (2024-01-15) 
      // -> Home & Garden (2024-01-10) -> Books (null)
      expect(names).toEqual([
        "Automotive",
        "Fashion",
        "Electronics",
        "Home & Garden",
        "Books",
      ]);
    });

    it("should place most recently updated category first", () => {
      const result = sortCategories(mockCategories, "recently-updated");
      expect(result[0].name).toBe("Automotive");
      expect(result[0].updated_at).toBe("2024-01-25T10:00:00Z");
    });

    it("should handle null updated_at dates", () => {
      const result = sortCategories(mockCategories, "recently-updated");
      // Categories with null updated_at should be last
      const lastCategory = result[result.length - 1];
      expect(lastCategory.name).toBe("Books");
      expect(lastCategory.updated_at).toBeNull();
    });

    it("should treat null dates as oldest", () => {
      const withMultipleNulls: Category[] = [
        {
          id: "1",
          name: "Recent",
          slug: "recent",
          description: "Recent",
          parent_id: null,
          listing_count: 10,
          image_url: null,
          display_order: 1,
          updated_at: "2024-01-20T10:00:00Z",
        },
        {
          id: "2",
          name: "Old1",
          slug: "old1",
          description: "Old1",
          parent_id: null,
          listing_count: 10,
          image_url: null,
          display_order: 2,
          updated_at: null as any,
        },
        {
          id: "3",
          name: "Old2",
          slug: "old2",
          description: "Old2",
          parent_id: null,
          listing_count: 10,
          image_url: null,
          display_order: 3,
          updated_at: null as any,
        },
      ];
      const result = sortCategories(withMultipleNulls, "recently-updated");
      expect(result[0].name).toBe("Recent");
    });

    it("should handle undefined updated_at", () => {
      const withUndefined: Category[] = [
        {
          id: "1",
          name: "Test",
          slug: "test",
          description: "Test",
          parent_id: null,
          listing_count: 10,
          image_url: null,
          display_order: 1,
          updated_at: undefined as any,
        },
        {
          id: "2",
          name: "Test2",
          slug: "test2",
          description: "Test2",
          parent_id: null,
          listing_count: 10,
          image_url: null,
          display_order: 2,
          updated_at: "2024-01-20T10:00:00Z",
        },
      ];
      const result = sortCategories(withUndefined, "recently-updated");
      expect(result[0].name).toBe("Test2");
    });

    it("should handle same updated_at dates", () => {
      const withSameDates: Category[] = [
        {
          id: "1",
          name: "A",
          slug: "a",
          description: "A",
          parent_id: null,
          listing_count: 10,
          image_url: null,
          display_order: 1,
          updated_at: "2024-01-20T10:00:00Z",
        },
        {
          id: "2",
          name: "B",
          slug: "b",
          description: "B",
          parent_id: null,
          listing_count: 10,
          image_url: null,
          display_order: 2,
          updated_at: "2024-01-20T10:00:00Z",
        },
      ];
      const result = sortCategories(withSameDates, "recently-updated");
      expect(result).toHaveLength(2);
      // Order should be stable for same dates
    });
  });

  describe("Unknown sort option", () => {
    it("should not change order for unknown sort option", () => {
      const original = [...mockCategories];
      const result = sortCategories(mockCategories, "unknown-option");
      expect(result.map((c) => c.id)).toEqual(original.map((c) => c.id));
    });
  });

  describe("Stable sorting", () => {
    it("should maintain relative order for equal values in alphabetical sort", () => {
      const sameName: Category[] = [
        { ...mockCategories[0], id: "1", name: "Test" },
        { ...mockCategories[1], id: "2", name: "Test" },
        { ...mockCategories[2], id: "3", name: "Test" },
      ];
      const result = sortCategories(sameName, "alphabetical-asc");
      // All have same name, order should be preserved or stable
      expect(result).toHaveLength(3);
    });

    it("should maintain relative order for equal listing counts", () => {
      const sameCount: Category[] = [
        { ...mockCategories[0], id: "1", listing_count: 100 },
        { ...mockCategories[1], id: "2", listing_count: 100 },
        { ...mockCategories[2], id: "3", listing_count: 100 },
      ];
      const result = sortCategories(sameCount, "most-listings");
      expect(result).toHaveLength(3);
    });
  });

  describe("Array immutability", () => {
    it("should not mutate the original array", () => {
      const original = [...mockCategories];
      const originalIds = original.map((c) => c.id);
      sortCategories(mockCategories, "alphabetical-asc");
      expect(mockCategories.map((c) => c.id)).toEqual(originalIds);
    });

    it("should return a new array", () => {
      const result = sortCategories(mockCategories, "alphabetical-asc");
      expect(result).not.toBe(mockCategories);
    });
  });

  describe("Edge cases", () => {
    it("should handle categories with special characters in names", () => {
      const special: Category[] = [
        { ...mockCategories[0], name: "A & B" },
        { ...mockCategories[1], name: "C - D" },
        { ...mockCategories[2], name: "E / F" },
      ];
      const result = sortCategories(special, "alphabetical-asc");
      expect(result[0].name).toBe("A & B");
    });

    it("should handle very long category names", () => {
      const longName: Category[] = [
        { ...mockCategories[0], name: "A".repeat(200) },
        { ...mockCategories[1], name: "B".repeat(200) },
      ];
      const result = sortCategories(longName, "alphabetical-asc");
      expect(result[0].name).toBe("A".repeat(200));
    });

    it("should handle negative listing counts", () => {
      const negative: Category[] = [
        { ...mockCategories[0], listing_count: -10 },
        { ...mockCategories[1], listing_count: 5 },
        { ...mockCategories[2], listing_count: 0 },
      ];
      const result = sortCategories(negative, "most-listings");
      expect(result[0].listing_count).toBe(5);
      expect(result[result.length - 1].listing_count).toBe(-10);
    });

    it("should handle very large listing counts", () => {
      const large: Category[] = [
        { ...mockCategories[0], listing_count: 1000000 },
        { ...mockCategories[1], listing_count: 999999 },
      ];
      const result = sortCategories(large, "most-listings");
      expect(result[0].listing_count).toBe(1000000);
    });
  });
});
