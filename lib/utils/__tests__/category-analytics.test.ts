/**
 * Unit Tests for Category Analytics
 * Task 15.5: Write unit tests for analytics endpoints
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  aggregateCategoryAnalytics,
  incrementCategorySearchCount,
  incrementCategoryViewCount,
} from "../category-analytics";

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

describe("Category Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("aggregateCategoryAnalytics", () => {
    it("should aggregate analytics for all categories", async () => {
      // Mock categories response
      const mockCategories = [
        { id: "cat-1", name: "Category 1" },
        { id: "cat-2", name: "Category 2" },
      ];

      // Mock business count responses
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "categories") {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockCategories,
              error: null,
            }),
          };
        }
        if (table === "business_category_tags") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 5,
                error: null,
              }),
            }),
          };
        }
        if (table === "category_analytics") {
          return {
            upsert: vi.fn().mockResolvedValue({
              error: null,
            }),
          };
        }
        return {};
      });

      const result = await aggregateCategoryAnalytics(
        mockSupabase as any,
        new Date("2024-01-01"),
        "daily",
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        category_id: "cat-1",
        business_count: 5,
        search_count: 0,
        view_count: 0,
        period_date: "2024-01-01",
        period_type: "daily",
      });
    });

    it("should handle empty categories list", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "categories") {
          return {
            select: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return {};
      });

      const result = await aggregateCategoryAnalytics(
        mockSupabase as any,
        new Date("2024-01-01"),
        "daily",
      );

      expect(result).toHaveLength(0);
    });

    it("should handle database errors gracefully", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "categories") {
          return {
            select: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          };
        }
        return {};
      });

      await expect(
        aggregateCategoryAnalytics(mockSupabase as any, new Date("2024-01-01"), "daily"),
      ).rejects.toThrow();
    });
  });

  describe("incrementCategorySearchCount", () => {
    it("should increment existing search count", async () => {
      const mockExisting = {
        id: "analytics-1",
        category_id: "cat-1",
        search_count: 10,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "category_analytics") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockExisting,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      await incrementCategorySearchCount(mockSupabase as any, "cat-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("category_analytics");
    });

    it("should create new record if none exists", async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "category_analytics") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: "PGRST116" }, // No rows returned
                    }),
                  }),
                }),
              }),
            }),
            insert: vi.fn().mockResolvedValue({
              error: null,
            }),
          };
        }
        return {};
      });

      await incrementCategorySearchCount(mockSupabase as any, "cat-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("category_analytics");
    });
  });

  describe("incrementCategoryViewCount", () => {
    it("should increment existing view count", async () => {
      const mockExisting = {
        id: "analytics-1",
        category_id: "cat-1",
        view_count: 20,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "category_analytics") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockExisting,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      await incrementCategoryViewCount(mockSupabase as any, "cat-1");

      expect(mockSupabase.from).toHaveBeenCalledWith("category_analytics");
    });
  });
});
