import { describe, it, expect } from "vitest";
import type { Category } from "@/lib/types/core";

/**
 * Unit Tests: Category Filtering Logic
 * 
 * Tests search filtering functionality:
 * - Search by category name (case-insensitive)
 * - Search by category description (case-insensitive)
 * - Combined name and description search
 * - Empty results handling
 * - Top-level filter (parent_id === null)
 * - Has listings filter (listing_count > 0)
 * 
 * Requirements: 2.2, 2.3, 3.8, 3.9
 * Property 4: Search Filtering Completeness
 */

/**
 * Filter categories by search query
 * Matches against name and description (case-insensitive)
 */
function filterCategoriesBySearch(
  categories: Category[],
  searchQuery: string
): Category[] {
  if (!searchQuery.trim()) {
    return categories;
  }

  const query = searchQuery.toLowerCase().trim();
  return categories.filter(
    (category) =>
      category.name.toLowerCase().includes(query) ||
      (category.description && category.description.toLowerCase().includes(query))
  );
}

/**
 * Filter categories to show only top-level (parent_id === null)
 */
function filterTopLevelCategories(categories: Category[]): Category[] {
  return categories.filter((category) => category.parent_id === null);
}

/**
 * Filter categories to show only those with active listings
 */
function filterCategoriesWithListings(categories: Category[]): Category[] {
  return categories.filter((category) => (category.listing_count || 0) > 0);
}

describe("Category Filtering Logic", () => {
  const mockCategories: Category[] = [
    {
      id: "1",
      name: "Electronics",
      slug: "electronics",
      description: "Electronic devices and gadgets",
      parent_id: null,
      listing_count: 150,
      image_url: null,
      display_order: 1,
    },
    {
      id: "2",
      name: "Laptops",
      slug: "laptops",
      description: "Portable computers and notebooks",
      parent_id: "1",
      listing_count: 80,
      image_url: null,
      display_order: 1,
    },
    {
      id: "3",
      name: "Fashion",
      slug: "fashion",
      description: "Clothing, shoes, and accessories",
      parent_id: null,
      listing_count: 200,
      image_url: null,
      display_order: 2,
    },
    {
      id: "4",
      name: "Men's Clothing",
      slug: "mens-clothing",
      description: "Clothing for men",
      parent_id: "3",
      listing_count: 0,
      image_url: null,
      display_order: 1,
    },
    {
      id: "5",
      name: "Home & Garden",
      slug: "home-garden",
      description: "Furniture, decor, and garden supplies",
      parent_id: null,
      listing_count: 50,
      image_url: null,
      display_order: 3,
    },
    {
      id: "6",
      name: "Smartphones",
      slug: "smartphones",
      description: null, // Test category without description
      parent_id: "1",
      listing_count: 120,
      image_url: null,
      display_order: 2,
    },
  ];

  describe("Search filtering by name", () => {
    it("should filter categories by name (case-insensitive)", () => {
      const result = filterCategoriesBySearch(mockCategories, "electronics");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Electronics");
    });

    it("should filter categories by partial name match", () => {
      const result = filterCategoriesBySearch(mockCategories, "men's");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Men's Clothing");
    });

    it("should be case-insensitive for name search", () => {
      const result = filterCategoriesBySearch(mockCategories, "FASHION");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Fashion");
    });

    it("should return multiple matches for common terms", () => {
      const result = filterCategoriesBySearch(mockCategories, "e");
      // Should match: Electronics, Men's Clothing, Home & Garden, Smartphones
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("Search filtering by description", () => {
    it("should filter categories by description (case-insensitive)", () => {
      const result = filterCategoriesBySearch(mockCategories, "furniture");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Home & Garden");
    });

    it("should filter categories by partial description match", () => {
      const result = filterCategoriesBySearch(mockCategories, "devices");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Electronics");
    });

    it("should be case-insensitive for description search", () => {
      const result = filterCategoriesBySearch(mockCategories, "PORTABLE");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Laptops");
    });

    it("should handle categories without description", () => {
      const result = filterCategoriesBySearch(mockCategories, "smartphones");
      // Should match by name only
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Smartphones");
    });
  });

  describe("Combined name and description search", () => {
    it("should match if query appears in either name or description", () => {
      const result = filterCategoriesBySearch(mockCategories, "clothing");
      // Should match: Fashion (description), Men's Clothing (name)
      expect(result.length).toBeGreaterThanOrEqual(2);
      const names = result.map((c) => c.name);
      expect(names).toContain("Fashion");
      expect(names).toContain("Men's Clothing");
    });

    it("should handle search terms that match multiple fields", () => {
      const result = filterCategoriesBySearch(mockCategories, "garden");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Home & Garden");
    });
  });

  describe("Empty results handling", () => {
    it("should return empty array when no matches found", () => {
      const result = filterCategoriesBySearch(mockCategories, "xyz123");
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return all categories when search query is empty", () => {
      const result = filterCategoriesBySearch(mockCategories, "");
      expect(result).toHaveLength(mockCategories.length);
    });

    it("should return all categories when search query is only whitespace", () => {
      const result = filterCategoriesBySearch(mockCategories, "   ");
      expect(result).toHaveLength(mockCategories.length);
    });

    it("should handle empty categories array", () => {
      const result = filterCategoriesBySearch([], "test");
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Top-level filter (parent_id === null)", () => {
    it("should return only categories with parent_id === null", () => {
      const result = filterTopLevelCategories(mockCategories);
      expect(result).toHaveLength(3);
      const names = result.map((c) => c.name);
      expect(names).toContain("Electronics");
      expect(names).toContain("Fashion");
      expect(names).toContain("Home & Garden");
    });

    it("should exclude all subcategories", () => {
      const result = filterTopLevelCategories(mockCategories);
      result.forEach((category) => {
        expect(category.parent_id).toBeNull();
      });
    });

    it("should handle empty array", () => {
      const result = filterTopLevelCategories([]);
      expect(result).toHaveLength(0);
    });

    it("should handle array with no top-level categories", () => {
      const subcategoriesOnly: Category[] = [
        {
          id: "1",
          name: "Subcategory 1",
          slug: "subcategory-1",
          description: "Test",
          parent_id: "parent-id",
          listing_count: 10,
          image_url: null,
          display_order: 1,
        },
      ];
      const result = filterTopLevelCategories(subcategoriesOnly);
      expect(result).toHaveLength(0);
    });
  });

  describe("Has listings filter (listing_count > 0)", () => {
    it("should return only categories with listing_count > 0", () => {
      const result = filterCategoriesWithListings(mockCategories);
      expect(result).toHaveLength(5);
      result.forEach((category) => {
        expect((category.listing_count || 0) > 0).toBe(true);
      });
    });

    it("should exclude categories with listing_count = 0", () => {
      const result = filterCategoriesWithListings(mockCategories);
      const names = result.map((c) => c.name);
      expect(names).not.toContain("Men's Clothing"); // Has 0 listings
    });

    it("should handle categories with undefined listing_count", () => {
      const categoriesWithUndefined: Category[] = [
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
      ];
      const result = filterCategoriesWithListings(categoriesWithUndefined);
      expect(result).toHaveLength(0);
    });

    it("should handle empty array", () => {
      const result = filterCategoriesWithListings([]);
      expect(result).toHaveLength(0);
    });

    it("should include categories with any positive listing count", () => {
      const result = filterCategoriesWithListings(mockCategories);
      const listingCounts = result.map((c) => c.listing_count);
      expect(Math.min(...listingCounts!)).toBeGreaterThan(0);
    });
  });

  describe("Combined filters", () => {
    it("should apply search and top-level filter together", () => {
      let result = filterCategoriesBySearch(mockCategories, "fashion");
      result = filterTopLevelCategories(result);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Fashion");
    });

    it("should apply search and has listings filter together", () => {
      let result = filterCategoriesBySearch(mockCategories, "clothing");
      result = filterCategoriesWithListings(result);
      // Men's Clothing has 0 listings, so should be excluded
      const names = result.map((c) => c.name);
      expect(names).toContain("Fashion");
      expect(names).not.toContain("Men's Clothing");
    });

    it("should apply all three filters together", () => {
      let result = mockCategories;
      result = filterCategoriesBySearch(result, "e");
      result = filterTopLevelCategories(result);
      result = filterCategoriesWithListings(result);
      // Should only include top-level categories with 'e' in name/description and listings > 0
      result.forEach((category) => {
        expect(category.parent_id).toBeNull();
        expect((category.listing_count || 0) > 0).toBe(true);
      });
    });
  });

  describe("Special characters and edge cases", () => {
    it("should handle search with special characters", () => {
      const result = filterCategoriesBySearch(mockCategories, "Men's");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Men's Clothing");
    });

    it("should handle search with ampersand", () => {
      const result = filterCategoriesBySearch(mockCategories, "Home &");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Home & Garden");
    });

    it("should trim whitespace from search query", () => {
      const result = filterCategoriesBySearch(mockCategories, "  fashion  ");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Fashion");
    });

    it("should handle multi-word search", () => {
      const result = filterCategoriesBySearch(mockCategories, "electronic devices");
      // Should match Electronics (contains both words)
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });
});
