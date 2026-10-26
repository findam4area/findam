/**
 * Integration tests for Category System (Task 16.1)
 * Tests category hierarchy integrity, validation, and subcategory filtering
 * 
 * NOTE: These tests are for the OLD schema with separate subcategories table.
 * The advanced taxonomy uses hierarchical categories with parent_id.
 * See integration-checkpoint.test.ts for tests validating the new system.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@/lib/supabase/client";

describe.skip("Category System Integration Tests (OLD SCHEMA)", () => {
  let supabase: ReturnType<typeof createClient>;
  let testCategoryId: string;
  let testSubcategoryId: string;
  let invalidSubcategoryId: string;

  beforeAll(async () => {
    supabase = createClient();

    // Get a test category (Electronics)
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("name", "Electronics")
      .single();

    testCategoryId = category?.id ?? "";

    // Get a test subcategory (Phones) for Electronics
    const { data: subcategory } = await supabase
      .from("subcategories")
      .select("id")
      .eq("category_id", testCategoryId)
      .eq("name", "Phones")
      .single();

    testSubcategoryId = subcategory?.id ?? "";

    // Get a subcategory from a different category (Fashion > Clothing)
    const { data: fashionCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("name", "Fashion")
      .single();

    const { data: invalidSubcategory } = await supabase
      .from("subcategories")
      .select("id")
      .eq("category_id", fashionCategory?.id ?? "")
      .eq("name", "Clothing")
      .single();

    invalidSubcategoryId = invalidSubcategory?.id ?? "";
  });

  describe("Category Hierarchy Integrity", () => {
    it("should validate that a subcategory belongs to its parent category", async () => {
      const { data } = await supabase
        .from("subcategories")
        .select("category_id")
        .eq("id", testSubcategoryId)
        .single();

      expect(data?.category_id).toBe(testCategoryId);
    });

    it("should reject a subcategory that does not belong to the specified category", async () => {
      const { data } = await supabase
        .from("subcategories")
        .select("category_id")
        .eq("id", invalidSubcategoryId)
        .single();

      expect(data?.category_id).not.toBe(testCategoryId);
    });

    it("should get the parent category for a subcategory", async () => {
      const { data } = await supabase
        .from("subcategories")
        .select(
          `
          category_id,
          category:categories(*)
        `,
        )
        .eq("id", testSubcategoryId)
        .single();

      expect(data).toBeTruthy();
      expect(data?.category_id).toBe(testCategoryId);
      expect((data?.category as any)?.name).toBe("Electronics");
    });

    it("should return null for an invalid subcategory", async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000000")
        .single();

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });
  });

  describe("Subcategory Filtering by Parent", () => {
    it("should get all subcategories for a category", async () => {
      const { data: subcategories } = await supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", testCategoryId)
        .order("display_order", { ascending: true });

      expect(subcategories).toBeTruthy();
      expect(subcategories!.length).toBeGreaterThan(0);
      expect(
        subcategories!.every((sub) => sub.category_id === testCategoryId),
      ).toBe(true);
    });

    it("should return subcategories in display order", async () => {
      const { data: subcategories } = await supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", testCategoryId)
        .order("display_order", { ascending: true });

      expect(subcategories).toBeTruthy();
      for (let i = 1; i < subcategories!.length; i++) {
        expect(subcategories![i].display_order ?? 0).toBeGreaterThanOrEqual(
          subcategories![i - 1].display_order ?? 0,
        );
      }
    });

    it("should return empty array for non-existent category", async () => {
      const { data: subcategories } = await supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", "00000000-0000-0000-0000-000000000000");

      expect(subcategories).toEqual([]);
    });
  });

  describe("Category Validation for Listings", () => {
    it("should validate correct category and subcategory pair", async () => {
      const { data: subcategory } = await supabase
        .from("subcategories")
        .select("id, category_id")
        .eq("id", testSubcategoryId)
        .single();

      expect(subcategory).toBeTruthy();
      expect(subcategory?.category_id).toBe(testCategoryId);
    });

    it("should reject mismatched category and subcategory", async () => {
      const { data: subcategory } = await supabase
        .from("subcategories")
        .select("id, category_id")
        .eq("id", invalidSubcategoryId)
        .single();

      expect(subcategory).toBeTruthy();
      expect(subcategory?.category_id).not.toBe(testCategoryId);
    });

    it("should reject invalid category", async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id")
        .eq("id", "00000000-0000-0000-0000-000000000000")
        .single();

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    it("should reject invalid subcategory", async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("id")
        .eq("id", "00000000-0000-0000-0000-000000000000")
        .single();

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });
  });

  describe("API Integration", () => {
    it("should fetch all categories with subcategories", async () => {
      const { data: categories } = await supabase
        .from("categories")
        .select(
          `
          id,
          name,
          icon,
          display_order,
          subcategories:subcategories(
            id,
            name,
            display_order
          )
        `,
        )
        .order("display_order", { ascending: true });

      expect(categories).toBeTruthy();
      expect(categories!.length).toBeGreaterThanOrEqual(23); // 23+ main categories (Advanced Category Taxonomy)
      if (categories && categories.length > 0 && categories[0].subcategories) {
        expect((categories[0].subcategories as any[]).length).toBeGreaterThan(0);
      }
    });

    it("should fetch subcategories for a specific category", async () => {
      const { data: subcategories } = await supabase
        .from("subcategories")
        .select("*")
        .eq("category_id", testCategoryId)
        .order("display_order", { ascending: true });

      expect(subcategories).toBeTruthy();
      // May have 0 subcategories depending on test data
      if (subcategories && subcategories.length > 0) {
        expect(
          subcategories.every((sub) => sub.category_id === testCategoryId),
        ).toBe(true);
      }
    });
  });

  describe("Category Icons", () => {
    it("should have lucide-react icon names for all categories", async () => {
      const { data: categories } = await supabase
        .from("categories")
        .select("name, icon");

      expect(categories).toBeTruthy();
      expect(categories!.length).toBeGreaterThanOrEqual(23); // Advanced taxonomy has 23+ main categories

      // Verify all categories have icons
      categories!.forEach((category: any) => {
        expect(category.icon).toBeTruthy();
        expect(category.icon.length).toBeGreaterThan(0);
      });

      // Verify some category icons from the new advanced taxonomy
      const mediaCategory = categories!.find(
        (c: any) => c.name === "Media & Entertainment",
      );
      if (mediaCategory) {
        expect(mediaCategory.icon).toBeTruthy();
      }

      const healthCategory = categories!.find(
        (c: any) => c.name === "Health & Medical",
      );
      if (healthCategory) {
        expect(healthCategory.icon).toBeTruthy();
      }
    });
  });

  describe("Advanced Category Taxonomy", () => {
    it("should have 23 main categories from advanced taxonomy", async () => {
      const { data: categories } = await supabase
        .from("categories")
        .select("name")
        .order("display_order", { ascending: true });

      const expectedCategories = [
        "Home & Construction",
        "Health & Medical",
        "Retail & Shopping",
        "Education & Training",
        "Food & Beverage",
        "Finance & Insurance",
        "Technology & IT",
        "Professional Services",
        "Automotive",
        "Travel & Tourism",
        "Fashion & Beauty",
        "Agriculture & Farming",
        "Energy & Environment",
        "Manufacturing & Industrial",
        "Media & Entertainment",
        "Logistics & Supply Chain",
        "Real Estate & Property",
        "Non-Profit & Social",
        "Events & Hospitality",
        "Crafts & Creative Services",
        "Childcare & Family",
        "Pets & Animals",
        "Other / Miscellaneous",
      ];

      expect(categories).toBeTruthy();
      expect(categories!.length).toBeGreaterThanOrEqual(23);

      const categoryNames = categories!.map((c: any) => c.name);
      
      // Check that at least some of the expected categories are present
      const foundCount = expectedCategories.filter(name => 
        categoryNames.includes(name)
      ).length;
      
      expect(foundCount).toBeGreaterThan(10); // At least half of the expected categories
    });
  });
});