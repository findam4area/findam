/**
 * Alert Service Tests
 * Tests for smart alerts and saved searches functionality
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AlertService } from "../alert";

// Track the last insert/update data for dynamic mocking
let lastInsertData: any = {};
let lastUpdateData: any = {};

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table) => {
      const mockChain = {
        insert: vi.fn((data) => {
          lastInsertData = Array.isArray(data) ? data[0] : data;
          return mockChain;
        }),
        select: vi.fn(() => mockChain),
        update: vi.fn((data) => {
          lastUpdateData = data;
          return mockChain;
        }),
        delete: vi.fn(() => mockChain),
        eq: vi.fn(() => mockChain),
        gte: vi.fn(() => mockChain),
        order: vi.fn(() => mockChain),
        limit: vi.fn(() => mockChain),
        range: vi.fn(() => mockChain),
        single: vi.fn(() => {
          // For insert operations (search_alerts table)
          if (lastInsertData.alert_type) {
            return {
              data: {
                id: "test-alert-id",
                user_id: lastInsertData.user_id || "test-user-id",
                listing_id: lastInsertData.listing_id || "listing-1",
                saved_search_id:
                  lastInsertData.saved_search_id || "test-search-id",
                alert_type: lastInsertData.alert_type,
                previous_price: lastInsertData.previous_price,
                new_price: lastInsertData.new_price,
                price_drop_percentage: lastInsertData.price_drop_percentage,
                notification_method:
                  lastInsertData.notification_method || "push",
                is_read: false,
                sent_at: new Date().toISOString(),
                listing_snapshot: lastInsertData.listing_snapshot,
              },
              error: null,
            };
          }

          // For update operations (saved_searches table)
          if (Object.keys(lastUpdateData).length > 0) {
            return {
              data: {
                id: "test-search-id",
                user_id: "test-user-id",
                name: lastUpdateData.name || "Test Search",
                query: lastUpdateData.query || { keywords: "iPhone" },
                notification_frequency:
                  lastUpdateData.notification_frequency || "instant",
                is_paused: lastUpdateData.is_paused ?? false,
                new_match_count: 0,
                last_checked: new Date().toISOString(),
                last_activity_at: new Date().toISOString(),
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            };
          }

          // Default for saved_searches
          return {
            data: {
              id: "test-search-id",
              user_id: "test-user-id",
              name: "Test Search",
              query: { keywords: "iPhone" },
              notification_frequency: "instant",
              is_paused: false,
              new_match_count: 0,
              last_checked: new Date().toISOString(),
              last_activity_at: new Date().toISOString(),
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          };
        }),
        data: [],
        error: null,
      };
      return mockChain;
    }),
    rpc: vi.fn((funcName) => {
      if (funcName === "can_create_saved_search") {
        return Promise.resolve({ data: true, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: "test-user-id" } },
        error: null,
      })),
    },
  })),
}));

// Mock Typesense
vi.mock("@/lib/typesense/queries", () => ({
  searchListings: vi.fn(() =>
    Promise.resolve({
      hits: [
        {
          id: "listing-1",
          title: "iPhone 13 Pro",
          price: 500000,
          created_at: new Date().toISOString(),
          images: ["image1.jpg"],
        },
      ],
      estimatedTotalHits: 1,
    }),
  ),
}));

describe("AlertService", () => {
  describe("createSavedSearch", () => {
    it("should create a saved search successfully", async () => {
      const result = await AlertService.createSavedSearch({
        userId: "test-user-id",
        name: "Test Search",
        query: { keywords: "iPhone" },
        notificationFrequency: "instant",
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("Test Search");
      expect(result.query.keywords).toBe("iPhone");
      expect(result.notification_frequency).toBe("instant");
    });

    it("should throw error if user cannot create more searches", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockClient = createClient as any;
      mockClient.mockImplementationOnce(() => ({
        rpc: vi.fn(() => Promise.resolve({ data: false, error: null })),
      }));

      await expect(
        AlertService.createSavedSearch({
          userId: "test-user-id",
          name: "Test Search",
          query: { keywords: "iPhone" },
        }),
      ).rejects.toThrow("Saved search limit reached");
    });
  });

  describe("checkForMatches", () => {
    it("should return new matches and price drops", async () => {
      const result = await AlertService.checkForMatches("test-search-id");

      expect(result).toBeDefined();
      expect(result.newMatches).toBeDefined();
      expect(result.priceDrops).toBeDefined();
      expect(Array.isArray(result.newMatches)).toBe(true);
      expect(Array.isArray(result.priceDrops)).toBe(true);
    });

    it("should return empty arrays for paused searches", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const mockClient = createClient as any;
      mockClient.mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: "test-search-id",
                  is_paused: true,
                  is_active: true,
                  query: {},
                  last_checked: new Date().toISOString(),
                },
                error: null,
              })),
            })),
          })),
        })),
      }));

      const result = await AlertService.checkForMatches("test-search-id");

      expect(result.newMatches).toEqual([]);
      expect(result.priceDrops).toEqual([]);
    });
  });

  describe("sendAlert", () => {
    it("should create an alert for new listing", async () => {
      const result = await AlertService.sendAlert({
        savedSearchId: "test-search-id",
        userId: "test-user-id",
        listingId: "listing-1",
        alertType: "new_listing",
        listingSnapshot: {
          title: "iPhone 13 Pro",
          price: 500000,
        },
      });

      expect(result).toBeDefined();
      expect(result.alert_type).toBe("new_listing");
    });

    it("should create an alert for price drop", async () => {
      const result = await AlertService.sendAlert({
        savedSearchId: "test-search-id",
        userId: "test-user-id",
        listingId: "listing-1",
        alertType: "price_drop",
        previousPrice: 600000,
        newPrice: 500000,
        priceDropPercentage: 16.67,
        listingSnapshot: {
          title: "iPhone 13 Pro",
          price: 500000,
        },
      });

      expect(result).toBeDefined();
      expect(result.alert_type).toBe("price_drop");
      expect(result.previous_price).toBe(600000);
      expect(result.new_price).toBe(500000);
    });
  });

  describe("updateSavedSearch", () => {
    it("should update saved search successfully", async () => {
      const result = await AlertService.updateSavedSearch("test-search-id", {
        name: "Updated Search",
        notification_frequency: "daily",
      });

      expect(result).toBeDefined();
      expect(result.name).toBe("Updated Search");
      expect(result.notification_frequency).toBe("daily");
    });
  });

  describe("deleteSavedSearch", () => {
    it("should delete saved search successfully", async () => {
      await expect(
        AlertService.deleteSavedSearch("test-search-id"),
      ).resolves.not.toThrow();
    });
  });

  describe("getUserSavedSearches", () => {
    it("should return user's saved searches", async () => {
      const result = await AlertService.getUserSavedSearches("test-user-id");

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getUserAlerts", () => {
    it("should return user's alerts", async () => {
      const result = await AlertService.getUserAlerts({
        userId: "test-user-id",
        limit: 20,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter unread alerts when requested", async () => {
      const result = await AlertService.getUserAlerts({
        userId: "test-user-id",
        unreadOnly: true,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
