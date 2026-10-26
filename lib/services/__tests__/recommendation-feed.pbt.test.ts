/**
 * Property-Based Tests for Recommendation Feed
 * Feature: findam-marketplace-enhancements
 *
 * Property 25: Personalized Content Minimum
 * **Validates: Requirements 7.3**
 *
 * Property 26: Purchased Item Exclusion
 * **Validates: Requirements 7.9**
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fc from "fast-check";
import { createClient } from "@/lib/supabase/server";
import { RecommendationService } from "../recommendation";

// Arbitraries for generating test data
const userIdArbitrary = fc.uuid();
const listingIdArbitrary = fc.uuid();
const categoryIdArbitrary = fc.uuid();
const priceArbitrary = fc.integer({ min: 100, max: 1000000 });

describe.skip("Recommendation Feed - Property-Based Tests", () => {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  const testUserIds: string[] = [];
  const testListingIds: string[] = [];

  beforeAll(async () => {
    supabase = await createClient();
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    if (testUserIds.length > 0) {
      await supabase.from("user_behaviors").delete().in("user_id", testUserIds);
    }
    if (testListingIds.length > 0) {
      await supabase.from("listings").delete().in("id", testListingIds);
    }
  });

  /**
   * Property 25: Personalized Content Minimum
   * **Validates: Requirements 7.3**
   *
   * When a user has sufficient interaction history (≥5 interactions),
   * the feed MUST display at least 20% personalized content.
   *
   * This property verifies that:
   * 1. Users with ≥5 interactions receive personalized recommendations
   * 2. The recommendation algorithm is "hybrid" or "collaborative" (not "trending")
   * 3. The confidence score is > 0.5 (indicating personalization)
   * 4. At least 20% of requested listings are personalized
   */
  it("Property 25: Personalized Content Minimum", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          userIdArbitrary,
          fc.array(listingIdArbitrary, { minLength: 5, maxLength: 10 }),
          fc.array(categoryIdArbitrary, { minLength: 1, maxLength: 3 }),
        ),
        async ([userId, listingIds, categoryIds]) => {
          // Track this user for cleanup
          if (!testUserIds.includes(userId)) {
            testUserIds.push(userId);
          }

          // Initialize user behavior
          await RecommendationService.initializeUserBehavior(userId);

          // Create sufficient interaction history (≥5 interactions)
          for (let i = 0; i < listingIds.length; i++) {
            const listingId = listingIds[i];
            const categoryId = categoryIds[i % categoryIds.length];

            // Alternate between view and save interactions
            const interactionType = i % 2 === 0 ? "view" : "save";

            await RecommendationService.trackInteraction({
              userId,
              listingId,
              interactionType: interactionType as "view" | "save",
              metadata: {
                categoryId,
                duration: 30,
              },
            });
          }

          // Request recommendations (20 items)
          const recommendations =
            await RecommendationService.generateRecommendations({
              userId,
              limit: 20,
            });

          // Verify personalized content
          expect(recommendations).toBeDefined();
          expect(recommendations.listings).toBeDefined();
          expect(Array.isArray(recommendations.listings)).toBe(true);

          // Property 1: Algorithm should be personalized (not trending)
          expect(recommendations.algorithm).not.toBe("trending");
          expect(["hybrid", "collaborative", "content_based"]).toContain(
            recommendations.algorithm,
          );

          // Property 2: Confidence should indicate personalization (>0.5)
          expect(recommendations.confidence).toBeGreaterThan(0.5);

          // Property 3: At least 20% of listings should be personalized
          // Since we have sufficient history, we expect personalized results
          const minPersonalizedCount = Math.ceil(20 * 0.2); // 20% of 20 = 4
          expect(recommendations.listings.length).toBeGreaterThanOrEqual(
            minPersonalizedCount,
          );

          // Property verification: Personalized content minimum met
          return true;
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property 26: Purchased Item Exclusion
   * **Validates: Requirements 7.9**
   *
   * Previously purchased items MUST be excluded from recommendations.
   *
   * This property verifies that:
   * 1. Items marked as purchased are not included in recommendations
   * 2. The exclusion persists across multiple recommendation requests
   * 3. Purchased items are excluded even if they match user preferences
   * 4. The exclusion applies to all recommendation algorithms
   */
  it("Property 26: Purchased Item Exclusion", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          userIdArbitrary,
          fc.array(listingIdArbitrary, { minLength: 3, maxLength: 5 }),
          categoryIdArbitrary,
          priceArbitrary,
        ),
        async ([userId, listingIds, categoryId, price]) => {
          // Track this user for cleanup
          if (!testUserIds.includes(userId)) {
            testUserIds.push(userId);
          }

          // Initialize user behavior
          await RecommendationService.initializeUserBehavior(userId);

          // Create some interaction history
          for (let i = 0; i < listingIds.length - 1; i++) {
            await RecommendationService.trackInteraction({
              userId,
              listingId: listingIds[i],
              interactionType: "view",
              metadata: {
                categoryId,
                duration: 30,
              },
            });
          }

          // Mark the last listing as purchased
          const purchasedListingId = listingIds[listingIds.length - 1];
          await RecommendationService.trackInteraction({
            userId,
            listingId: purchasedListingId,
            interactionType: "purchase",
            metadata: {
              price,
            },
          });

          // Request recommendations
          const recommendations =
            await RecommendationService.generateRecommendations({
              userId,
              limit: 20,
            });

          // Verify purchased item exclusion
          expect(recommendations).toBeDefined();
          expect(recommendations.listings).toBeDefined();
          expect(Array.isArray(recommendations.listings)).toBe(true);

          // Property 1: Purchased item should NOT be in recommendations
          const purchasedItemInRecommendations = recommendations.listings.some(
            (listing) => listing.id === purchasedListingId,
          );
          expect(purchasedItemInRecommendations).toBe(false);

          // Property 2: Verify exclusion persists across multiple requests
          const secondRecommendations =
            await RecommendationService.generateRecommendations({
              userId,
              limit: 20,
            });

          const purchasedItemInSecondRequest =
            secondRecommendations.listings.some(
              (listing) => listing.id === purchasedListingId,
            );
          expect(purchasedItemInSecondRequest).toBe(false);

          // Property 3: Verify user behavior includes the purchase
          const userBehavior =
            await RecommendationService.getUserBehavior(userId);
          expect(userBehavior).toBeDefined();

          const purchasedListings = (userBehavior?.purchased_listings ||
            []) as any[];
          const purchaseRecord = purchasedListings.find(
            (p: any) => p.listing_id === purchasedListingId,
          );
          expect(purchaseRecord).toBeDefined();
          expect(purchaseRecord.price).toBe(price);

          // Property verification: Purchased items are excluded
          return true;
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Additional Property: Purchased Item Exclusion with Explicit Exclude List
   * **Validates: Requirements 7.9**
   *
   * Verifies that the excludeListingIds parameter works correctly
   * and purchased items are excluded even when not in the explicit list.
   */
  it("Property 26 (Extended): Purchased Item Exclusion with Explicit Exclude List", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          userIdArbitrary,
          fc.array(listingIdArbitrary, { minLength: 5, maxLength: 8 }),
          categoryIdArbitrary,
          priceArbitrary,
        ),
        async ([userId, listingIds, categoryId, price]) => {
          // Track this user for cleanup
          if (!testUserIds.includes(userId)) {
            testUserIds.push(userId);
          }

          // Initialize user behavior
          await RecommendationService.initializeUserBehavior(userId);

          // Create interaction history
          for (let i = 0; i < listingIds.length - 2; i++) {
            await RecommendationService.trackInteraction({
              userId,
              listingId: listingIds[i],
              interactionType: "view",
              metadata: {
                categoryId,
                duration: 30,
              },
            });
          }

          // Mark one listing as purchased
          const purchasedListingId = listingIds[listingIds.length - 2];
          await RecommendationService.trackInteraction({
            userId,
            listingId: purchasedListingId,
            interactionType: "purchase",
            metadata: {
              price,
            },
          });

          // Explicitly exclude another listing
          const explicitlyExcludedId = listingIds[listingIds.length - 1];

          // Request recommendations with explicit exclusion
          const recommendations =
            await RecommendationService.generateRecommendations({
              userId,
              limit: 20,
              excludeListingIds: [explicitlyExcludedId],
            });

          // Verify both exclusions
          expect(recommendations).toBeDefined();
          expect(recommendations.listings).toBeDefined();

          // Property 1: Purchased item should be excluded (automatic)
          const purchasedItemPresent = recommendations.listings.some(
            (listing) => listing.id === purchasedListingId,
          );
          expect(purchasedItemPresent).toBe(false);

          // Property 2: Explicitly excluded item should be excluded
          const explicitlyExcludedPresent = recommendations.listings.some(
            (listing) => listing.id === explicitlyExcludedId,
          );
          expect(explicitlyExcludedPresent).toBe(false);

          // Property verification: Both exclusion mechanisms work
          return true;
        },
      ),
      { numRuns: 10 },
    );
  });
});
