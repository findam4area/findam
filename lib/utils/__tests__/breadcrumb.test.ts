import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Category } from "@/lib/types/core";
import type { BreadcrumbItem } from "@/components/shared/breadcrumb";

/**
 * Unit Tests: Breadcrumb Construction Logic
 * 
 * Tests hierarchical breadcrumb path building:
 * - Top-level category (1 level: Home > Browse > Category)
 * - Nested categories (2-3 levels)
 * - Deeply nested categories (4+ levels)
 * - Broken parent chain handling
 * - Circular reference prevention
 * 
 * Requirements: 7.1, 7.2, 7.3, 16.11, 16.12, 16.13
 * Property 13: Breadcrumb Path Construction
 */

/**
 * Build hierarchical breadcrumb by traversing parent chain
 * This is a simplified version for testing - the actual implementation
 * is in app/(main)/categories/[slug]/page.tsx
 */
async function buildCategoryBreadcrumb(
  category: Category,
  getCategoryById: (id: string) => Promise<Category | null>
): Promise<BreadcrumbItem[]> {
  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Browse Categories", href: "/browse" },
  ];

  // Build path by traversing parent chain
  const path: Category[] = [];
  let current: Category | null = category;
  const visited = new Set<string>(); // Prevent circular references

  // Traverse up to root (max 10 levels to prevent infinite loops)
  let depth = 0;
  const MAX_DEPTH = 10;

  while (current?.parent_id && depth < MAX_DEPTH) {
    // Check for circular reference
    if (visited.has(current.id)) {
      console.warn("Circular reference detected in category hierarchy");
      break;
    }
    visited.add(current.id);

    const parent = await getCategoryById(current.parent_id);
    if (parent) {
      path.unshift(parent);
      current = parent;
    } else {
      // Parent not found - broken chain
      break;
    }
    depth++;
  }

  // Add all parents to breadcrumb
  for (const cat of path) {
    items.push({ label: cat.name, href: `/categories/${cat.slug}` });
  }

  // Add current category as the last item
  items.push({ label: category.name, href: `/categories/${category.slug}` });

  return items;
}

describe("Breadcrumb Construction Logic", () => {
  // Mock category repository
  const mockCategoryRepo = new Map<string, Category>();

  // Helper to create mock getCategoryById function
  const createGetCategoryById = () => {
    return async (id: string): Promise<Category | null> => {
      return mockCategoryRepo.get(id) || null;
    };
  };

  beforeEach(() => {
    mockCategoryRepo.clear();
  });

  describe("Top-level category (1 level)", () => {
    it("should build breadcrumb for top-level category", async () => {
      const category: Category = {
        id: "1",
        name: "Electronics",
        slug: "electronics",
        description: "Electronic devices",
        parent_id: null,
        listing_count: 100,
        image_url: null,
        display_order: 1,
      };

      const breadcrumb = await buildCategoryBreadcrumb(
        category,
        createGetCategoryById()
      );

      expect(breadcrumb).toHaveLength(3);
      expect(breadcrumb[0]).toEqual({ label: "Home", href: "/" });
      expect(breadcrumb[1]).toEqual({
        label: "Browse Categories",
        href: "/browse",
      });
      expect(breadcrumb[2]).toEqual({
        label: "Electronics",
        href: "/categories/electronics",
      });
    });

    it("should always start with Home and Browse Categories", async () => {
      const category: Category = {
        id: "1",
        name: "Test",
        slug: "test",
        description: "Test",
        parent_id: null,
        listing_count: 0,
        image_url: null,
        display_order: 1,
      };

      const breadcrumb = await buildCategoryBreadcrumb(
        category,
        createGetCategoryById()
      );

      expect(breadcrumb[0].label).toBe("Home");
      expect(breadcrumb[1].label).toBe("Browse Categories");
    });
  });

  describe("Nested categories (2-3 levels)", () => {
    it("should build breadcrumb for 2-level nested category", async () => {
      const parent: Category = {
        id: "1",
        name: "Electronics",
        slug: "electronics",
        description: "Electronic devices",
        parent_id: null,
        listing_count: 100,
        image_url: null,
        display_order: 1,
      };

      const child: Category = {
        id: "2",
        name: "Laptops",
        slug: "laptops",
        description: "Portable computers",
        parent_id: "1",
        listing_count: 50,
        image_url: null,
        display_order: 1,
      };

      mockCategoryRepo.set("1", parent);

      const breadcrumb = await buildCategoryBreadcrumb(
        child,
        createGetCategoryById()
      );

      expect(breadcrumb).toHaveLength(4);
      expect(breadcrumb[0].label).toBe("Home");
      expect(breadcrumb[1].label).toBe("Browse Categories");
      expect(breadcrumb[2]).toEqual({
        label: "Electronics",
        href: "/categories/electronics",
      });
      expect(breadcrumb[3]).toEqual({
        label: "Laptops",
        href: "/categories/laptops",
      });
    });

    it("should build breadcrumb for 3-level nested category", async () => {
      const grandparent: Category = {
        id: "1",
        name: "Electronics",
        slug: "electronics",
        description: "Electronic devices",
        parent_id: null,
        listing_count: 100,
        image_url: null,
        display_order: 1,
      };

      const parent: Category = {
        id: "2",
        name: "Computers",
        slug: "computers",
        description: "Computing devices",
        parent_id: "1",
        listing_count: 80,
        image_url: null,
        display_order: 1,
      };

      const child: Category = {
        id: "3",
        name: "Laptops",
        slug: "laptops",
        description: "Portable computers",
        parent_id: "2",
        listing_count: 50,
        image_url: null,
        display_order: 1,
      };

      mockCategoryRepo.set("1", grandparent);
      mockCategoryRepo.set("2", parent);

      const breadcrumb = await buildCategoryBreadcrumb(
        child,
        createGetCategoryById()
      );

      expect(breadcrumb).toHaveLength(5);
      expect(breadcrumb.map((b) => b.label)).toEqual([
        "Home",
        "Browse Categories",
        "Electronics",
        "Computers",
        "Laptops",
      ]);
    });

    it("should maintain correct order from root to leaf", async () => {
      const root: Category = {
        id: "1",
        name: "Root",
        slug: "root",
        description: "Root category",
        parent_id: null,
        listing_count: 100,
        image_url: null,
        display_order: 1,
      };

      const level1: Category = {
        id: "2",
        name: "Level 1",
        slug: "level-1",
        description: "Level 1",
        parent_id: "1",
        listing_count: 80,
        image_url: null,
        display_order: 1,
      };

      const level2: Category = {
        id: "3",
        name: "Level 2",
        slug: "level-2",
        description: "Level 2",
        parent_id: "2",
        listing_count: 50,
        image_url: null,
        display_order: 1,
      };

      mockCategoryRepo.set("1", root);
      mockCategoryRepo.set("2", level1);

      const breadcrumb = await buildCategoryBreadcrumb(
        level2,
        createGetCategoryById()
      );

      const categoryNames = breadcrumb.slice(2).map((b) => b.label);
      expect(categoryNames).toEqual(["Root", "Level 1", "Level 2"]);
    });
  });

  describe("Deeply nested categories (4+ levels)", () => {
    it("should build breadcrumb for 4-level nested category", async () => {
      const level0: Category = {
        id: "1",
        name: "Electronics",
        slug: "electronics",
        description: "Electronics",
        parent_id: null,
        listing_count: 100,
        image_url: null,
        display_order: 1,
      };

      const level1: Category = {
        id: "2",
        name: "Computers",
        slug: "computers",
        description: "Computers",
        parent_id: "1",
        listing_count: 80,
        image_url: null,
        display_order: 1,
      };

      const level2: Category = {
        id: "3",
        name: "Laptops",
        slug: "laptops",
        description: "Laptops",
        parent_id: "2",
        listing_count: 50,
        image_url: null,
        display_order: 1,
      };

      const level3: Category = {
        id: "4",
        name: "Gaming Laptops",
        slug: "gaming-laptops",
        description: "Gaming Laptops",
        parent_id: "3",
        listing_count: 25,
        image_url: null,
        display_order: 1,
      };

      mockCategoryRepo.set("1", level0);
      mockCategoryRepo.set("2", level1);
      mockCategoryRepo.set("3", level2);

      const breadcrumb = await buildCategoryBreadcrumb(
        level3,
        createGetCategoryById()
      );

      expect(breadcrumb).toHaveLength(6);
      expect(breadcrumb.map((b) => b.label)).toEqual([
        "Home",
        "Browse Categories",
        "Electronics",
        "Computers",
        "Laptops",
        "Gaming Laptops",
      ]);
    });

    it("should handle 5+ level hierarchy", async () => {
      // Create a 6-level deep hierarchy
      const categories: Category[] = [];
      for (let i = 0; i < 6; i++) {
        categories.push({
          id: `${i}`,
          name: `Level ${i}`,
          slug: `level-${i}`,
          description: `Level ${i}`,
          parent_id: i === 0 ? null : `${i - 1}`,
          listing_count: 10,
          image_url: null,
          display_order: 1,
        });
      }

      // Add all except the last to the repo
      for (let i = 0; i < 5; i++) {
        mockCategoryRepo.set(`${i}`, categories[i]);
      }

      const breadcrumb = await buildCategoryBreadcrumb(
        categories[5],
        createGetCategoryById()
      );

      // Should have Home + Browse + 6 levels = 8 items
      expect(breadcrumb).toHaveLength(8);
    });

    it("should limit depth to prevent infinite loops", async () => {
      // Create a very deep hierarchy (15 levels)
      const categories: Category[] = [];
      for (let i = 0; i < 15; i++) {
        categories.push({
          id: `${i}`,
          name: `Level ${i}`,
          slug: `level-${i}`,
          description: `Level ${i}`,
          parent_id: i === 0 ? null : `${i - 1}`,
          listing_count: 10,
          image_url: null,
          display_order: 1,
        });
      }

      // Add all except the last to the repo
      for (let i = 0; i < 14; i++) {
        mockCategoryRepo.set(`${i}`, categories[i]);
      }

      const breadcrumb = await buildCategoryBreadcrumb(
        categories[14],
        createGetCategoryById()
      );

      // Should be limited to MAX_DEPTH (10) + Home + Browse + current = 13 items max
      expect(breadcrumb.length).toBeLessThanOrEqual(13);
    });
  });

  describe("Broken parent chain handling", () => {
    it("should handle missing parent category", async () => {
      const child: Category = {
        id: "2",
        name: "Laptops",
        slug: "laptops",
        description: "Portable computers",
        parent_id: "non-existent",
        listing_count: 50,
        image_url: null,
        display_order: 1,
      };

      // Parent doesn't exist in repo
      const breadcrumb = await buildCategoryBreadcrumb(
        child,
        createGetCategoryById()
      );

      // Should still include current category
      expect(breadcrumb).toHaveLength(3);
      expect(breadcrumb[2]).toEqual({
        label: "Laptops",
        href: "/categories/laptops",
      });
    });

    it("should stop traversal when parent not found", async () => {
      const grandparent: Category = {
        id: "1",
        name: "Electronics",
        slug: "electronics",
        description: "Electronics",
        parent_id: null,
        listing_count: 100,
        image_url: null,
        display_order: 1,
      };

      const parent: Category = {
        id: "2",
        name: "Computers",
        slug: "computers",
        description: "Computers",
        parent_id: "1",
        listing_count: 80,
        image_url: null,
        display_order: 1,
      };

      const child: Category = {
        id: "3",
        name: "Laptops",
        slug: "laptops",
        description: "Laptops",
        parent_id: "2",
        listing_count: 50,
        image_url: null,
        display_order: 1,
      };

      // Only add grandparent, not parent
      mockCategoryRepo.set("1", grandparent);

      const breadcrumb = await buildCategoryBreadcrumb(
        child,
        createGetCategoryById()
      );

      // Should only have Home + Browse + Laptops (no broken chain included)
      expect(breadcrumb).toHaveLength(3);
      expect(breadcrumb[2].label).toBe("Laptops");
    });

    it("should handle partial chain with missing middle category", async () => {
      const level1: Category = {
        id: "1",
        name: "Electronics",
        slug: "electronics",
        description: "Electronics",
        parent_id: null,
        listing_count: 100,
        image_url: null,
        display_order: 1,
      };

      const level3: Category = {
        id: "3",
        name: "Laptops",
        slug: "laptops",
        description: "Laptops",
        parent_id: "2", // Level 2 missing
        listing_count: 50,
        image_url: null,
        display_order: 1,
      };

      mockCategoryRepo.set("1", level1);
      // Level 2 is intentionally missing

      const breadcrumb = await buildCategoryBreadcrumb(
        level3,
        createGetCategoryById()
      );

      // Should stop at broken link
      expect(breadcrumb).toHaveLength(3);
      expect(breadcrumb[2].label).toBe("Laptops");
    });
  });

  describe("Circular reference prevention", () => {
    it("should detect and break circular reference", async () => {
      const cat1: Category = {
        id: "1",
        name: "Category 1",
        slug: "category-1",
        description: "Category 1",
        parent_id: "2", // Points to cat2
        listing_count: 50,
        image_url: null,
        display_order: 1,
      };

      const cat2: Category = {
        id: "2",
        name: "Category 2",
        slug: "category-2",
        description: "Category 2",
        parent_id: "1", // Points back to cat1 - circular!
        listing_count: 50,
        image_url: null,
        display_order: 1,
      };

      mockCategoryRepo.set("1", cat1);
      mockCategoryRepo.set("2", cat2);

      const breadcrumb = await buildCategoryBreadcrumb(
        cat1,
        createGetCategoryById()
      );

      // Should break the circular reference and complete
      expect(breadcrumb).toBeDefined();
      expect(breadcrumb.length).toBeGreaterThanOrEqual(3);
    });

    it("should handle self-referencing category", async () => {
      const selfRef: Category = {
        id: "1",
        name: "Self",
        slug: "self",
        description: "Self-referencing",
        parent_id: "1", // Points to itself!
        listing_count: 50,
        image_url: null,
        display_order: 1,
      };

      mockCategoryRepo.set("1", selfRef);

      const breadcrumb = await buildCategoryBreadcrumb(
        selfRef,
        createGetCategoryById()
      );

      // Should detect self-reference and stop
      expect(breadcrumb).toBeDefined();
      // Home + Browse + Self + one iteration before detecting cycle
      expect(breadcrumb.length).toBeGreaterThanOrEqual(3);
      expect(breadcrumb.length).toBeLessThanOrEqual(4);
    });
  });

  describe("URL and slug handling", () => {
    it("should generate correct URLs for all breadcrumb items", async () => {
      const parent: Category = {
        id: "1",
        name: "Electronics",
        slug: "electronics",
        description: "Electronics",
        parent_id: null,
        listing_count: 100,
        image_url: null,
        display_order: 1,
      };

      const child: Category = {
        id: "2",
        name: "Laptops",
        slug: "laptops",
        description: "Laptops",
        parent_id: "1",
        listing_count: 50,
        image_url: null,
        display_order: 1,
      };

      mockCategoryRepo.set("1", parent);

      const breadcrumb = await buildCategoryBreadcrumb(
        child,
        createGetCategoryById()
      );

      expect(breadcrumb[0].href).toBe("/");
      expect(breadcrumb[1].href).toBe("/browse");
      expect(breadcrumb[2].href).toBe("/categories/electronics");
      expect(breadcrumb[3].href).toBe("/categories/laptops");
    });

    it("should handle slugs with special characters", async () => {
      const category: Category = {
        id: "1",
        name: "Home & Garden",
        slug: "home-and-garden",
        description: "Home & Garden",
        parent_id: null,
        listing_count: 100,
        image_url: null,
        display_order: 1,
      };

      const breadcrumb = await buildCategoryBreadcrumb(
        category,
        createGetCategoryById()
      );

      expect(breadcrumb[2].href).toBe("/categories/home-and-garden");
    });
  });

  describe("Edge cases", () => {
    it("should handle category with empty name", async () => {
      const category: Category = {
        id: "1",
        name: "",
        slug: "empty",
        description: "Empty name",
        parent_id: null,
        listing_count: 0,
        image_url: null,
        display_order: 1,
      };

      const breadcrumb = await buildCategoryBreadcrumb(
        category,
        createGetCategoryById()
      );

      expect(breadcrumb).toHaveLength(3);
      expect(breadcrumb[2].label).toBe("");
    });

    it("should handle very long category names", async () => {
      const longName = "A".repeat(200);
      const category: Category = {
        id: "1",
        name: longName,
        slug: "long",
        description: "Long name",
        parent_id: null,
        listing_count: 0,
        image_url: null,
        display_order: 1,
      };

      const breadcrumb = await buildCategoryBreadcrumb(
        category,
        createGetCategoryById()
      );

      expect(breadcrumb[2].label).toBe(longName);
    });

    it("should handle category with special characters in name", async () => {
      const category: Category = {
        id: "1",
        name: "Electronics & Gadgets / Tech",
        slug: "electronics-gadgets-tech",
        description: "Special chars",
        parent_id: null,
        listing_count: 0,
        image_url: null,
        display_order: 1,
      };

      const breadcrumb = await buildCategoryBreadcrumb(
        category,
        createGetCategoryById()
      );

      expect(breadcrumb[2].label).toBe("Electronics & Gadgets / Tech");
    });
  });
});
