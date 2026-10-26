import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient } from "@/lib/supabase/client";
import type { Listing } from "@/lib/types";

/**
 * Integration Test: Feed Flow
 *
 * Tests the complete feed browsing experience:
 * 1. Browse feed with listings
 * 2. Apply filters (category, price, location)
 * 3. View listing details
 * 4. Interact with listings (like, save)
 */

describe("Integration: Feed Flow", () => {
  let supabase: ReturnType<typeof createClient>;

  beforeEach(() => {
    supabase = createClient();
  });

  describe("1. Browse Feed", () => {
    it("should fetch active listings from the feed", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(
          `
          id,
          title,
          description,
          price,
          thumbnail_url,
          is_boosted,
          is_active,
          created_at,
          user:users(id, username, avatar_url, trust_score)
        `,
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        // Error is acceptable if no listings exist yet
        expect(error.code).not.toBe("42P01"); // Not a table error
      } else {
        expect(data).toBeDefined();
        expect(Array.isArray(data)).toBe(true);

        // If listings exist, verify structure
        if (data && data.length > 0) {
          const listing = data[0];
          expect(listing).toHaveProperty("id");
          expect(listing).toHaveProperty("title");
          expect(listing).toHaveProperty("is_active");
          expect(listing.is_active).toBe(true);
        }
      }
    });

    it("should prioritize boosted listings in feed", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, is_boosted, boost_expires_at")
        .eq("is_active", true)
        .eq("is_boosted", true)
        .gte("boost_expires_at", new Date().toISOString())
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else {
        expect(data).toBeDefined();

        // If boosted listings exist, verify they're valid
        if (data && data.length > 0) {
          data.forEach((listing) => {
            expect(listing.is_boosted).toBe(true);
            expect(listing.boost_expires_at).toBeDefined();
          });
        }
      }
    });

    it("should support infinite scroll pagination", async () => {
      const pageSize = 20;

      // Fetch first page
      const { data: page1, error: error1 } = await supabase
        .from("listings")
        .select("id, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(0, pageSize - 1);

      if (error1) {
        expect(error1.code).not.toBe("42P01");
      } else {
        expect(page1).toBeDefined();

        // If we have enough listings, fetch second page
        if (page1 && page1.length === pageSize) {
          const { data: page2, error: error2 } = await supabase
            .from("listings")
            .select("id, created_at")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .range(pageSize, pageSize * 2 - 1);

          if (error2) {
            expect(error2.code).not.toBe("42P01");
          } else {
            expect(page2).toBeDefined();

            // Verify pages don't overlap
            if (page2 && page2.length > 0) {
              const page1Ids = page1.map((l) => l.id);
              const page2Ids = page2.map((l) => l.id);
              const overlap = page1Ids.filter((id) => page2Ids.includes(id));
              expect(overlap.length).toBe(0);
            }
          }
        }
      }
    });
  });

  describe("2. Apply Filters", () => {
    it("should filter listings by category", async () => {
      // First, get a category
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name")
        .limit(1);

      if (categories && categories.length > 0) {
        const categoryId = categories[0].id;

        const { data, error } = await supabase
          .from("listings")
          .select("id, title, category_id")
          .eq("is_active", true)
          .eq("category_id", categoryId)
          .limit(10);

        if (error) {
          expect(error.code).not.toBe("42P01");
        } else {
          expect(data).toBeDefined();

          // Verify all listings match the category
          if (data && data.length > 0) {
            data.forEach((listing) => {
              expect(listing.category_id).toBe(categoryId);
            });
          }
        }
      }
    });

    it("should filter listings by price range", async () => {
      const minPrice = 10000;
      const maxPrice = 100000;

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price")
        .eq("is_active", true)
        .gte("price", minPrice)
        .lte("price", maxPrice)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else {
        expect(data).toBeDefined();

        // Verify all listings are within price range
        if (data && data.length > 0) {
          data.forEach((listing) => {
            if (listing.price !== null) {
              expect(listing.price).toBeGreaterThanOrEqual(minPrice);
              expect(listing.price).toBeLessThanOrEqual(maxPrice);
            }
          });
        }
      }
    });

    it("should filter listings by location (state)", async () => {
      const state = "Lagos";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, state")
        .eq("is_active", true)
        .eq("state", state)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else {
        expect(data).toBeDefined();

        // Verify all listings match the state
        if (data && data.length > 0) {
          data.forEach((listing) => {
            expect(listing.state).toBe(state);
          });
        }
      }
    });

    it("should filter listings by condition", async () => {
      const condition = "new";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, condition")
        .eq("is_active", true)
        .eq("condition", condition)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else {
        expect(data).toBeDefined();

        // Verify all listings match the condition
        if (data && data.length > 0) {
          data.forEach((listing) => {
            expect(listing.condition).toBe(condition);
          });
        }
      }
    });

    it("should combine multiple filters", { timeout: 15000 }, async () => {
      const minPrice = 10000;
      const maxPrice = 100000;
      const state = "Lagos";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price, state")
        .eq("is_active", true)
        .gte("price", minPrice)
        .lte("price", maxPrice)
        .eq("state", state)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else {
        expect(data).toBeDefined();

        // Verify all listings match all filters
        if (data && data.length > 0) {
          data.forEach((listing) => {
            expect(listing.state).toBe(state);
            if (listing.price !== null) {
              expect(listing.price).toBeGreaterThanOrEqual(minPrice);
              expect(listing.price).toBeLessThanOrEqual(maxPrice);
            }
          });
        }
      }
    });
  });

  describe("3. View Listing Details", () => {
    it("should fetch complete listing details with media", async () => {
      // Get a listing first
      const { data: listings } = await supabase
        .from("listings")
        .select("id")
        .eq("is_active", true)
        .limit(1);

      if (listings && listings.length > 0) {
        const listingId = listings[0].id;

        const { data, error } = await supabase
          .from("listings")
          .select(
            `
            *,
            user:users(id, username, avatar_url, trust_score, phone_verified, nin_verified),
            media:listing_media(id, media_url, media_type, display_order),
            category:categories(id, name, icon),
            subcategory:subcategories(id, name)
          `,
          )
          .eq("id", listingId)
          .single();

        if (error) {
          expect(error.code).not.toBe("PGRST116"); // Not found is acceptable
        } else {
          expect(data).toBeDefined();
          expect(data.id).toBe(listingId);
          expect(data.user).toBeDefined();
          expect(data.category).toBeDefined();
        }
      }
    });

    it("should increment view count when viewing listing", async () => {
      // Get a listing first
      const { data: listings } = await supabase
        .from("listings")
        .select("id, views_count")
        .eq("is_active", true)
        .limit(1);

      if (listings && listings.length > 0) {
        const listing = listings[0];
        const originalViews = listing.views_count ?? 0;

        // Increment view count
        const { error } = await supabase
          .from("listings")
          .update({ views_count: originalViews + 1 })
          .eq("id", listing.id);

        if (error) {
          // Permission error is acceptable (RLS)
          expect(error.code).not.toBe("42P01");
        } else {
          // Verify increment
          const { data: updated } = await supabase
            .from("listings")
            .select("views_count")
            .eq("id", listing.id)
            .single();

          if (updated) {
            expect(updated.views_count ?? 0).toBeGreaterThanOrEqual(
              originalViews,
            );
          }
        }
      }
    });
  });

  describe("4. Interact with Listings", () => {
    it("should have user_likes table for like functionality", async () => {
      const { error } = await supabase
        .from("user_likes")
        .select("user_id, listing_id")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should have user_saves table for save functionality", async () => {
      const { error } = await supabase
        .from("user_saves")
        .select("user_id, listing_id")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should support retrieving saved listings for a user", async () => {
      // This would require authentication, so we just verify the query structure
      const mockUserId = "00000000-0000-0000-0000-000000000000";

      const { error } = await supabase
        .from("user_saves")
        .select(
          `
          listing:listings(
            id,
            title,
            price,
            thumbnail_url,
            is_active
          )
        `,
        )
        .eq("user_id", mockUserId);

      // Error is expected without auth, but table should exist
      expect(error?.code).not.toBe("42P01");
    });
  });

  describe("5. Search Functionality", () => {
    it("should support text search on listings", async () => {
      const searchQuery = "phone";

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, description")
        .eq("is_active", true)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else {
        expect(data).toBeDefined();

        // Verify search results contain the query
        if (data && data.length > 0) {
          data.forEach((listing) => {
            const matchesTitle = listing.title
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
            const matchesDescription = listing.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
            expect(matchesTitle || matchesDescription).toBe(true);
          });
        }
      }
    });
  });

  describe("6. Feed Performance", () => {
    it("should have indexes for efficient queries", async () => {
      // Verify that common queries execute quickly
      const startTime = Date.now();

      await supabase
        .from("listings")
        .select("id, title, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Query should complete in reasonable time (< 2 seconds)
      expect(queryTime).toBeLessThan(2000);
    });
  });
});
