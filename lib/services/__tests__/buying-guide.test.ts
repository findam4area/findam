/**
 * Buying Guide Service Tests
 * Property 71: Buying Guide Availability
 * Property 72: Buying Guide Content Completeness
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("Buying Guide Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Property 71: Buying Guide Availability", () => {
    it("should return guides for all major categories", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              category_id: fc.uuid(),
              title: fc.lorem({ maxCount: 10 }),
              content: fc.lorem({ maxCount: 50 }),
              is_published: fc.constant(true),
              view_count: fc.integer({ min: 0, max: 10000 }),
              bookmark_count: fc.integer({ min: 0, max: 1000 }),
              checklist: fc.constant([]),
              price_ranges: fc.constant({}),
              comparison_chart: fc.constant([]),
              common_scams: fc.constant([]),
              key_features: fc.constant([]),
              market_prices: fc.constant({}),
              last_updated_at: fc.date().map((d) => d.toISOString()),
              created_at: fc.date().map((d) => d.toISOString()),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          async (guides) => {
            // Mock query - getAllGuides doesn't use limit()
            const mockQuery = {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: guides, error: null }),
            };

            mockSupabase.from.mockReturnValue(mockQuery);

            const { BuyingGuideService } =
              await import("@/lib/services/buying-guide");

            const result = await BuyingGuideService.getAllGuides();

            // Property: Must return array of guides
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(guides.length);

            // Property: Each guide must have required fields
            result.forEach((guide) => {
              expect(guide).toHaveProperty("id");
              expect(guide).toHaveProperty("category_id");
              expect(guide).toHaveProperty("title");
              expect(guide).toHaveProperty("content");
              expect(guide).toHaveProperty("checklist");
              expect(guide).toHaveProperty("price_ranges");
              expect(guide).toHaveProperty("comparison_chart");
              expect(guide).toHaveProperty("common_scams");
              expect(guide).toHaveProperty("key_features");
              expect(guide).toHaveProperty("market_prices");

              // Property: Title must not be empty
              expect(guide.title.length).toBeGreaterThan(0);

              // Property: Content must not be empty
              expect(guide.content.length).toBeGreaterThan(0);
            });
          },
        ),
        { numRuns: 10 },
      );
    });

    it("should return guide for specific category", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            category_id: fc.uuid(),
            title: fc.string({ minLength: 5, maxLength: 100 }),
            content: fc.string({ minLength: 100, maxLength: 1000 }),
            is_published: fc.constant(true),
            view_count: fc.integer({ min: 0, max: 10000 }),
            bookmark_count: fc.integer({ min: 0, max: 1000 }),
            checklist: fc.constant([]),
            price_ranges: fc.constant({}),
            comparison_chart: fc.constant([]),
            common_scams: fc.constant([]),
            key_features: fc.constant([]),
            market_prices: fc.constant({}),
            last_updated_at: fc.date().map((d) => d.toISOString()),
            created_at: fc.date().map((d) => d.toISOString()),
          }),
          async (guide) => {
            // Create chainable mock that properly handles multiple .eq() calls
            const mockChain = {
              select: vi.fn(),
              eq: vi.fn(),
              single: vi.fn(),
              update: vi.fn(),
            };

            // Make all methods return the chain itself
            mockChain.select.mockReturnValue(mockChain);
            mockChain.eq.mockReturnValue(mockChain);
            mockChain.single.mockResolvedValue({ data: guide, error: null });
            mockChain.update.mockReturnValue(mockChain);

            mockSupabase.from.mockReturnValue(mockChain);

            const { BuyingGuideService } =
              await import("@/lib/services/buying-guide");

            const result = await BuyingGuideService.getGuideByCategory(
              guide.category_id,
            );

            // Property: Must return guide for the category
            expect(result).not.toBeNull();
            expect(result?.category_id).toBe(guide.category_id);
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  describe("Property 72: Buying Guide Content Completeness", () => {
    it("should have all required content sections", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            category_id: fc.uuid(),
            title: fc.string({ minLength: 5, maxLength: 100 }),
            content: fc.string({ minLength: 100, maxLength: 1000 }),
            is_published: fc.constant(true),
            view_count: fc.integer({ min: 0, max: 10000 }),
            bookmark_count: fc.integer({ min: 0, max: 1000 }),
            checklist: fc.array(
              fc.record({
                id: fc.uuid(),
                text: fc.string({ minLength: 10, maxLength: 100 }),
                category: fc.constantFrom(
                  "physical",
                  "functional",
                  "documentation",
                  "safety",
                ),
              }),
              { minLength: 3, maxLength: 10 },
            ),
            price_ranges: fc.record({
              new: fc.record({
                min: fc.integer({ min: 1000, max: 50000 }),
                max: fc.integer({ min: 50000, max: 500000 }),
              }),
              excellent: fc.record({
                min: fc.integer({ min: 1000, max: 40000 }),
                max: fc.integer({ min: 40000, max: 400000 }),
              }),
            }),
            comparison_chart: fc.array(
              fc.record({
                name: fc.string({ minLength: 5, maxLength: 50 }),
                specs: fc.constant({ RAM: "8GB", Storage: "256GB" }),
                price_range: fc.record({
                  min: fc.integer({ min: 1000, max: 50000 }),
                  max: fc.integer({ min: 50000, max: 500000 }),
                }),
              }),
              { minLength: 2, maxLength: 5 },
            ),
            common_scams: fc.array(
              fc.string({ minLength: 20, maxLength: 200 }),
              { minLength: 3, maxLength: 10 },
            ),
            key_features: fc.array(
              fc.string({ minLength: 10, maxLength: 100 }),
              { minLength: 5, maxLength: 15 },
            ),
            market_prices: fc.constant({}),
            last_updated_at: fc.date().map((d) => d.toISOString()),
            created_at: fc.date().map((d) => d.toISOString()),
          }),
          async (guide) => {
            // Create chainable mock that properly handles multiple .eq() calls
            const mockChain = {
              select: vi.fn(),
              eq: vi.fn(),
              single: vi.fn(),
              update: vi.fn(),
            };

            // Make all methods return the chain itself
            mockChain.select.mockReturnValue(mockChain);
            mockChain.eq.mockReturnValue(mockChain);
            mockChain.single.mockResolvedValue({ data: guide, error: null });
            mockChain.update.mockReturnValue(mockChain);

            mockSupabase.from.mockReturnValue(mockChain);

            const { BuyingGuideService } =
              await import("@/lib/services/buying-guide");

            const result = await BuyingGuideService.getGuideById(guide.id);

            // Property: Guide must have main content
            expect(result).not.toBeNull();
            expect(result!.content.length).toBeGreaterThan(0);

            // Property: Guide must have checklist with items
            expect(Array.isArray(result!.checklist)).toBe(true);
            expect(result!.checklist.length).toBeGreaterThan(0);

            // Property: Each checklist item must have required fields
            result!.checklist.forEach((item) => {
              expect(item).toHaveProperty("id");
              expect(item).toHaveProperty("text");
              expect(item).toHaveProperty("category");
              expect(item.text.length).toBeGreaterThan(0);
              expect([
                "physical",
                "functional",
                "documentation",
                "safety",
              ]).toContain(item.category);
            });

            // Property: Guide must have price ranges
            expect(result!.price_ranges).toBeDefined();
            expect(Object.keys(result!.price_ranges).length).toBeGreaterThan(0);

            // Property: Each price range must have min and max
            Object.values(result!.price_ranges).forEach((range) => {
              expect(range).toHaveProperty("min");
              expect(range).toHaveProperty("max");
              expect(range.min).toBeLessThan(range.max);
            });

            // Property: Guide must have common scams list
            expect(Array.isArray(result!.common_scams)).toBe(true);
            expect(result!.common_scams.length).toBeGreaterThan(0);

            // Property: Guide must have key features list
            expect(Array.isArray(result!.key_features)).toBe(true);
            expect(result!.key_features.length).toBeGreaterThan(0);

            // Property: Guide must have comparison chart
            expect(Array.isArray(result!.comparison_chart)).toBe(true);
            expect(result!.comparison_chart.length).toBeGreaterThan(0);

            // Property: Each comparison item must have required fields
            result!.comparison_chart.forEach((item) => {
              expect(item).toHaveProperty("name");
              expect(item).toHaveProperty("specs");
              expect(item).toHaveProperty("price_range");
              expect(item.price_range.min).toBeLessThan(item.price_range.max);
            });
          },
        ),
        { numRuns: 10 },
      );
    });
  });
});
