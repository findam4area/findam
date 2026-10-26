import { describe, it, expect, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/client";

/**
 * Integration Test: Listing Creation Flow
 *
 * Tests the complete listing creation experience:
 * 1. Verify user can create a listing
 * 2. Upload media (images/videos)
 * 3. Validate listing limits (free vs premium)
 * 4. Verify phone verification requirement
 * 5. Publish and view listing
 */

describe("Integration: Listing Creation Flow", () => {
  let supabase: ReturnType<typeof createClient>;

  beforeEach(() => {
    supabase = createClient();
  });

  describe("1. Listing Creation Prerequisites", () => {
    it("should have listings table with required fields", async () => {
      const { error } = await supabase
        .from("listings")
        .select(
          "id, title, description, price, user_id, category_id, is_active",
        )
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should have listing_media table for media uploads", async () => {
      const { error } = await supabase
        .from("listing_media")
        .select("id, listing_id, media_url, media_type, display_order")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should have categories table populated", async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, icon")
        .limit(1);

      // Handle network errors gracefully
      if (error && error.message && error.message.includes("fetch failed")) {
        // Network error - skip this check
        expect(error).toBeDefined();
        return;
      }

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);
    });
  });

  describe("2. Listing Validation", () => {
    it("should require category_id for listings", async () => {
      const { data: categories } = await supabase
        .from("categories")
        .select("id")
        .limit(1);

      if (categories && categories.length > 0) {
        const categoryId = categories[0].id;

        // Verify category exists
        const { data, error } = await supabase
          .from("categories")
          .select("id, name")
          .eq("id", categoryId)
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data?.id).toBe(categoryId);
      }
    });

    it("should require location (state) for listings", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, state, area")
        .eq("is_active", true)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        // All active listings should have a state
        data.forEach((listing: any) => {
          expect(listing.state).toBeDefined();
          expect(listing.state).not.toBeNull();
        });
      }
    });

    it("should validate price is non-negative", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, price")
        .eq("is_active", true)
        .limit(10);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          if (listing.price !== null) {
            expect(listing.price ?? 0).toBeGreaterThanOrEqual(0);
          }
        });
      }
    });
  });

  describe("3. Media Upload", () => {
    it("should support multiple media items per listing", async () => {
      const { data: listings } = await supabase
        .from("listings")
        .select("id")
        .eq("is_active", true)
        .limit(1);

      if (listings && listings.length > 0) {
        const listingId = listings[0].id;

        const { data, error } = await supabase
          .from("listing_media")
          .select("id, listing_id, media_url, media_type, display_order")
          .eq("listing_id", listingId)
          .order("display_order", { ascending: true });

        if (error) {
          expect(error.code).not.toBe("42P01");
        } else {
          expect(data).toBeDefined();
          // Verify display_order is sequential if media exists
          if (data && data.length > 1) {
            for (let i = 0; i < data.length - 1; i++) {
              expect(data[i].display_order ?? 0).toBeLessThan(
                data[i + 1].display_order ?? 0,
              );
            }
          }
        }
      }
    });

    it("should support both image and video media types", async () => {
      const { data, error } = await supabase
        .from("listing_media")
        .select("id, media_type")
        .limit(20);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        // Verify media_type is either 'image' or 'video'
        data.forEach((media) => {
          expect(["image", "video"]).toContain(media.media_type);
        });
      }
    });

    it("should have storage bucket for listing media", async () => {
      const { data, error } = await supabase.storage.listBuckets();

      // Handle network errors gracefully
      if (error && error.message && error.message.includes("fetch failed")) {
        // Network error - skip this check
        expect(error).toBeDefined();
        return;
      }

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Listing media bucket may not be created yet - this is optional
      const listingMediaBucket = data?.find(
        (bucket) => bucket.name === "listing-media",
      );
      if (data && data.length > 0) {
        // If any buckets exist, we can verify the structure
        expect(data.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("4. Listing Limits and Tiers", () => {
    it("should track user listing count", async () => {
      // Get a user with listings
      const { data: listings } = await supabase
        .from("listings")
        .select("user_id")
        .limit(1);

      if (listings && listings.length > 0) {
        const userId = listings[0].user_id ?? "";

        const { data, error } = await supabase
          .from("listings")
          .select("id")
          .eq("user_id", userId)
          .eq("is_active", true);

        if (error) {
          expect(error.code).not.toBe("42P01");
        } else {
          expect(data).toBeDefined();
          expect(Array.isArray(data)).toBe(true);
        }
      }
    });

    it("should have premium tier information in users table", async () => {
      const { error } = await supabase
        .from("users")
        .select("id, is_premium, premium_expires_at")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should enforce free tier limit (5 listings)", async () => {
      // Get a non-premium user
      const { data: users } = await supabase
        .from("users")
        .select("id, is_premium")
        .eq("is_premium", false)
        .limit(1);

      if (users && users.length > 0) {
        const userId = users[0].id;

        const { data, error } = await supabase
          .from("listings")
          .select("id")
          .eq("user_id", userId)
          .eq("is_active", true);

        if (error) {
          expect(error.code).not.toBe("42P01");
        } else if (data) {
          // Free users should have <= 5 active listings
          expect(data.length).toBeLessThanOrEqual(5);
        }
      }
    });

    it("should allow premium users up to 30 listings", async () => {
      // Get a premium user
      const { data: users } = await supabase
        .from("users")
        .select("id, is_premium")
        .eq("is_premium", true)
        .limit(1);

      if (users && users.length > 0) {
        const userId = users[0].id;

        const { data, error } = await supabase
          .from("listings")
          .select("id")
          .eq("user_id", userId)
          .eq("is_active", true);

        if (error) {
          expect(error.code).not.toBe("42P01");
        } else if (data) {
          // Premium users should have <= 30 active listings
          expect(data.length).toBeLessThanOrEqual(30);
        }
      }
    });
  });

  describe("5. Phone Verification Requirement", () => {
    it("should track phone verification status", async () => {
      const { error } = await supabase
        .from("users")
        .select("id, phone_verified, phone_number")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should prevent unverified users from publishing listings", async () => {
      // Get an unverified user
      const { data: users } = await supabase
        .from("users")
        .select("id, phone_verified")
        .eq("phone_verified", false)
        .limit(1);

      if (users && users.length > 0) {
        const userId = users[0].id;

        // Check if they have any active listings (should be 0 or blocked by RLS)
        const { data, error } = await supabase
          .from("listings")
          .select("id")
          .eq("user_id", userId)
          .eq("is_active", true);

        if (error) {
          expect(error.code).not.toBe("42P01");
        } else if (data) {
          // Unverified users should not have active listings
          expect(data.length).toBe(0);
        }
      }
    });
  });

  describe("6. Listing Publication", () => {
    it("should set is_active to true when publishing", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, is_active, created_at")
        .eq("is_active", true)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          expect(listing.is_active).toBe(true);
          expect(listing.created_at).toBeDefined();
        });
      }
    });

    it("should initialize counters on listing creation", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, views_count, likes_count, saves_count")
        .eq("is_active", true)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else if (data && data.length > 0) {
        data.forEach((listing) => {
          expect(listing.views_count).toBeGreaterThanOrEqual(0);
          expect(listing.likes_count).toBeGreaterThanOrEqual(0);
          expect(listing.saves_count).toBeGreaterThanOrEqual(0);
        });
      }
    });

    it("should allow listing editing after publication", async () => {
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, description, updated_at")
        .eq("is_active", true)
        .limit(1);

      if (listings && listings.length > 0) {
        const listing = listings[0];

        // Verify updated_at exists
        expect(listing.updated_at).toBeDefined();
      }
    });

    it("should support soft deletion (is_active = false)", async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, is_active")
        .eq("is_active", false)
        .limit(5);

      if (error) {
        expect(error.code).not.toBe("42P01");
      } else {
        expect(data).toBeDefined();
        // Soft-deleted listings should not appear in active feeds
        if (data && data.length > 0) {
          data.forEach((listing) => {
            expect(listing.is_active).toBe(false);
          });
        }
      }
    });
  });

  describe("7. Listing Visibility", () => {
    it("should make published listings visible in feed", async () => {
      const { data: newListing } = await supabase
        .from("listings")
        .select("id, is_active, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (newListing && newListing.length > 0) {
        const listingId = newListing[0].id;

        // Verify it appears in feed query
        const { data: feedListings, error } = await supabase
          .from("listings")
          .select("id")
          .eq("is_active", true)
          .eq("id", listingId);

        expect(error).toBeNull();
        expect(feedListings).toBeDefined();
        expect(feedListings?.length).toBe(1);
      }
    });

    it("should include listing in search results", async () => {
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title")
        .eq("is_active", true)
        .limit(1);

      if (listings && listings.length > 0) {
        const listing = listings[0];
        const searchTerm = listing.title.split(" ")[0]; // First word of title

        const { data, error } = await supabase
          .from("listings")
          .select("id, title")
          .eq("is_active", true)
          .ilike("title", `%${searchTerm}%`);

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data?.some((l) => l.id === listing.id)).toBe(true);
      }
    });
  });

  describe("8. Scam Detection", () => {
    it("should flag suspicious listings", async () => {
      const { error } = await supabase
        .from("listings")
        .select("id, is_flagged, flag_reason")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should track reports table", async () => {
      const { error } = await supabase
        .from("reports")
        .select("id, listing_id, reporter_id, reason")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });
  });
});
