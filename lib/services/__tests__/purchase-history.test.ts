/**
 * Purchase History Service Tests
 * Property 65: Purchase History Sort Order
 * Property 66: Reorder Availability Check
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

// Mock Typesense
vi.mock("@/lib/typesense/queries", () => ({
  searchListings: vi.fn(() =>
    Promise.resolve({
      hits: [
        {
          id: "similar-1",
          title: "Similar Item",
          price: 5000,
          category_id: "cat-1",
        },
      ],
    }),
  ),
}));

describe("Purchase History Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Property 65: Purchase History Sort Order", () => {
    it("should always return purchases in reverse chronological order", async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              buyer_id: fc.uuid(),
              seller_id: fc.uuid(),
              listing_id: fc.uuid(),
              amount: fc.integer({ min: 100, max: 1000000 }),
              quantity: fc.integer({ min: 1, max: 10 }),
              delivery_status: fc.constantFrom(
                "pending",
                "processing",
                "shipped",
                "delivered",
              ),
              purchased_at: fc.date({
                min: new Date("2020-01-01"),
                max: new Date(),
              }),
              created_at: fc.date({
                min: new Date("2020-01-01"),
                max: new Date(),
              }),
              updated_at: fc.date({
                min: new Date("2020-01-01"),
                max: new Date(),
              }),
            }),
            { minLength: 2, maxLength: 20 },
          ),
          async (purchases) => {
            // Mock the database response
            const mockQuery = {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              range: vi
                .fn()
                .mockResolvedValue({ data: purchases, error: null }),
            };

            mockSupabase.from.mockReturnValue(mockQuery);

            const { PurchaseHistoryService } =
              await import("@/lib/services/purchase-history");

            const result = await PurchaseHistoryService.getPurchaseHistory(
              "user-123",
              {},
              50,
              0,
            );

            // Verify order was called with correct parameters
            expect(mockQuery.order).toHaveBeenCalledWith("purchased_at", {
              ascending: false,
            });

            // Verify results are in descending order by purchased_at
            for (let i = 0; i < result.length - 1; i++) {
              const current = new Date(result[i].purchased_at).getTime();
              const next = new Date(result[i + 1].purchased_at).getTime();
              expect(current).toBeGreaterThanOrEqual(next);
            }
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  describe("Property 66: Reorder Availability Check", () => {
    it("should correctly check item availability from same seller", async () => {
      fc.assert(
        fc.asyncProperty(
          fc.record({
            purchaseId: fc.uuid(),
            userId: fc.uuid(),
            sellerId: fc.uuid(),
            listingId: fc.uuid(),
            isActive: fc.boolean(),
            sameSeller: fc.boolean(),
          }),
          async ({
            purchaseId,
            userId,
            sellerId,
            listingId,
            isActive,
            sameSeller,
          }) => {
            // Mock purchase record
            const mockPurchaseQuery = {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: purchaseId,
                  buyer_id: userId,
                  seller_id: sellerId,
                  listing_id: listingId,
                  listing: {
                    id: listingId,
                    title: "Test Item",
                    price: 5000,
                    is_active: isActive,
                    user_id: sameSeller ? sellerId : "different-seller",
                  },
                },
                error: null,
              }),
            };

            // Mock listing query
            const mockListingQuery = {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: listingId,
                  title: "Test Item",
                  price: 5000,
                  category_id: "cat-1",
                },
                error: null,
              }),
            };

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === "purchase_records") return mockPurchaseQuery;
              if (table === "listings") return mockListingQuery;
              return mockPurchaseQuery;
            });

            const { PurchaseHistoryService } =
              await import("@/lib/services/purchase-history");

            const result = await PurchaseHistoryService.reorderItem(
              userId,
              purchaseId,
            );

            // Property: Item should be available only if active AND from same seller
            const expectedAvailability = isActive && sameSeller;

            expect(result.available).toBe(expectedAvailability);

            if (expectedAvailability) {
              expect(result.listing).toBeDefined();
              expect(result.reason).toBeUndefined();
            } else {
              expect(result.available).toBe(false);
              expect(result.reason).toBeDefined();
              expect(result.suggestions).toBeDefined();
            }
          },
        ),
        { numRuns: 20 },
      );
    });

    it("should provide fallback suggestions when item unavailable", async () => {
      fc.assert(
        fc.asyncProperty(
          fc.record({
            purchaseId: fc.uuid(),
            userId: fc.uuid(),
            listingId: fc.uuid(),
          }),
          async ({ purchaseId, userId, listingId }) => {
            // Mock purchase record with inactive listing
            const mockPurchaseQuery = {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: purchaseId,
                  buyer_id: userId,
                  seller_id: "seller-123",
                  listing_id: listingId,
                  listing: {
                    id: listingId,
                    title: "Test Item",
                    price: 5000,
                    is_active: false,
                    user_id: "seller-123",
                  },
                },
                error: null,
              }),
            };

            const mockListingQuery = {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: listingId,
                  title: "Test Item",
                  price: 5000,
                  category_id: "cat-1",
                },
                error: null,
              }),
            };

            mockSupabase.from.mockImplementation((table: string) => {
              if (table === "purchase_records") return mockPurchaseQuery;
              if (table === "listings") return mockListingQuery;
              return mockPurchaseQuery;
            });

            const { PurchaseHistoryService } =
              await import("@/lib/services/purchase-history");

            const result = await PurchaseHistoryService.reorderItem(
              userId,
              purchaseId,
            );

            // Property: When unavailable, must provide suggestions
            expect(result.available).toBe(false);
            expect(result.suggestions).toBeDefined();
            expect(Array.isArray(result.suggestions)).toBe(true);
          },
        ),
        { numRuns: 10 },
      );
    });
  });
});
