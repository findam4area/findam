/**
 * Recommendation Service
 * Requirements: 7.1, 7.2, 7.5
 *
 * Handles personalized recommendations using collaborative filtering algorithms
 * and tracks user interactions for recommendation generation.
 */

import { createClient } from "@/lib/supabase/server";
import { Listing } from "@/lib/types";

// User behavior type based on migration schema
interface UserBehavior {
  id: string;
  user_id: string;
  viewed_listings: any; // JSONB array
  saved_listings: any; // JSONB array
  purchased_listings: any; // JSONB array
  search_queries: any; // JSONB array
  category_preferences: any; // JSONB object
  price_range_min: number | null;
  price_range_max: number | null;
  location_preferences: any; // JSONB array
  created_at: string | null;
  updated_at: string | null;
}

export interface InteractionData {
  userId: string;
  listingId: string;
  interactionType: "view" | "save" | "purchase" | "search";
  metadata?: {
    duration?: number; // For views
    query?: string; // For searches
    price?: number; // For purchases
    categoryId?: string;
    location?: string;
  };
}

export interface RecommendationOptions {
  userId: string;
  limit?: number;
  excludeListingIds?: string[];
  categoryId?: string;
}

export interface RecommendationResult {
  listings: Listing[];
  algorithm: "collaborative" | "content_based" | "trending" | "hybrid";
  confidence: number;
}

export class RecommendationService {
  /**
   * Track user interaction with a listing
   * Requirements: 7.1
   */
  static async trackInteraction(data: InteractionData): Promise<void> {
    const supabase = await createClient();

    try {
      switch (data.interactionType) {
        case "view":
          await supabase.rpc("track_listing_view", {
            p_user_id: data.userId,
            p_listing_id: data.listingId,
            p_duration: data.metadata?.duration || 0,
          });

          // Update category preference if available
          if (data.metadata?.categoryId) {
            await supabase.rpc("update_category_preference", {
              p_user_id: data.userId,
              p_category_id: data.metadata.categoryId,
            });
          }
          break;

        case "save":
          await this.trackSave(data.userId, data.listingId);
          break;

        case "purchase":
          await this.trackPurchase(
            data.userId,
            data.listingId,
            data.metadata?.price || 0,
          );
          break;

        case "search":
          if (data.metadata?.query) {
            await supabase.rpc("track_search_query", {
              p_user_id: data.userId,
              p_query: data.metadata.query,
              p_results_count: 0,
            });
          }
          break;
      }

      // Update location preference if provided
      if (data.metadata?.location) {
        await this.updateLocationPreference(
          data.userId,
          data.metadata.location,
        );
      }
    } catch (error) {
      console.error("Error tracking interaction:", error);
      throw error;
    }
  }

  /**
   * Track listing save
   * Requirements: 7.1
   */
  private static async trackSave(
    userId: string,
    listingId: string,
  ): Promise<void> {
    const supabase = await createClient();

    const saveData = {
      listing_id: listingId,
      timestamp: new Date().toISOString(),
    };

    await supabase.rpc("initialize_user_behavior", { p_user_id: userId });

    // Append to saved_listings array
    const { data: behavior } = await supabase
      .from("user_behaviors")
      .select("saved_listings")
      .eq("user_id", userId)
      .single();

    if (behavior) {
      const savedListings = (behavior.saved_listings as any[]) || [];
      const updatedSaved = [...savedListings, saveData].slice(-500); // Keep last 500

      await supabase
        .from("user_behaviors")
        .update({ saved_listings: updatedSaved })
        .eq("user_id", userId);
    }
  }

  /**
   * Track listing purchase
   * Requirements: 7.1
   */
  private static async trackPurchase(
    userId: string,
    listingId: string,
    price: number,
  ): Promise<void> {
    const supabase = await createClient();

    const purchaseData = {
      listing_id: listingId,
      timestamp: new Date().toISOString(),
      price,
    };

    await supabase.rpc("initialize_user_behavior", { p_user_id: userId });

    // Append to purchased_listings array
    const { data: behavior } = await supabase
      .from("user_behaviors")
      .select("purchased_listings, price_range_min, price_range_max")
      .eq("user_id", userId)
      .single();

    if (behavior) {
      const purchasedListings = (behavior.purchased_listings as any[]) || [];
      const updatedPurchased = [...purchasedListings, purchaseData].slice(-200); // Keep last 200

      // Update price range preferences based on purchase
      const priceRangeMin = Math.min(
        behavior.price_range_min || price,
        price * 0.7,
      );
      const priceRangeMax = Math.max(
        behavior.price_range_max || price,
        price * 1.5,
      );

      await supabase
        .from("user_behaviors")
        .update({
          purchased_listings: updatedPurchased,
          price_range_min: Math.floor(priceRangeMin),
          price_range_max: Math.ceil(priceRangeMax),
        })
        .eq("user_id", userId);
    }
  }

  /**
   * Update location preference
   * Requirements: 7.5
   */
  private static async updateLocationPreference(
    userId: string,
    location: string,
  ): Promise<void> {
    const supabase = await createClient();

    await supabase.rpc("initialize_user_behavior", { p_user_id: userId });

    const { data: behavior } = await supabase
      .from("user_behaviors")
      .select("location_preferences")
      .eq("user_id", userId)
      .single();

    if (behavior) {
      const locations = (behavior.location_preferences as string[]) || [];

      // Add location if not already present, keep last 10
      if (!locations.includes(location)) {
        const updatedLocations = [...locations, location].slice(-10);

        await supabase
          .from("user_behaviors")
          .update({ location_preferences: updatedLocations })
          .eq("user_id", userId);
      }
    }
  }

  /**
   * Generate personalized recommendations using collaborative filtering
   * Requirements: 7.2, 7.5
   */
  static async generateRecommendations(
    options: RecommendationOptions,
  ): Promise<RecommendationResult> {
    const supabase = await createClient();
    const { userId, limit = 20, excludeListingIds = [], categoryId } = options;

    try {
      // Get user behavior data
      const { data: userBehavior } = await supabase
        .from("user_behaviors")
        .select("*")
        .eq("user_id", userId)
        .single();

      // If user has insufficient history, return trending items
      if (!userBehavior || this.hasInsufficientHistory(userBehavior)) {
        return await this.getTrendingRecommendations(limit, excludeListingIds);
      }

      // Use hybrid approach: collaborative + content-based
      const recommendations = await this.getHybridRecommendations(
        userBehavior,
        limit,
        excludeListingIds,
        categoryId,
      );

      return {
        listings: recommendations,
        algorithm: "hybrid",
        confidence: this.calculateConfidence(userBehavior),
      };
    } catch (error) {
      console.error("Error generating recommendations:", error);
      // Fallback to trending on error
      return await this.getTrendingRecommendations(limit, excludeListingIds);
    }
  }

  /**
   * Check if user has insufficient history for personalized recommendations
   * Requirements: 7.7
   */
  private static hasInsufficientHistory(behavior: UserBehavior): boolean {
    const viewedCount = ((behavior.viewed_listings as any[]) || []).length;
    const savedCount = ((behavior.saved_listings as any[]) || []).length;
    const purchasedCount = ((behavior.purchased_listings as any[]) || [])
      .length;
    const searchCount = ((behavior.search_queries as any[]) || []).length;

    const totalInteractions =
      viewedCount + savedCount + purchasedCount + searchCount;

    // Need at least 5 interactions for personalized recommendations
    return totalInteractions < 5;
  }

  /**
   * Get trending recommendations for users with insufficient history
   * Requirements: 7.7
   */
  private static async getTrendingRecommendations(
    limit: number,
    excludeListingIds: string[],
  ): Promise<RecommendationResult> {
    const supabase = await createClient();

    // Get trending listings based on views and recent activity
    const { data: listings } = await supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .not("id", "in", `(${excludeListingIds.join(",") || "null"})`)
      .order("views_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    return {
      listings: (listings || []) as Listing[],
      algorithm: "trending",
      confidence: 0.5,
    };
  }

  /**
   * Get hybrid recommendations using collaborative filtering and content-based filtering
   * Requirements: 7.2, 7.5, 22.3 (with vector embeddings)
   */
  private static async getHybridRecommendations(
    userBehavior: UserBehavior,
    limit: number,
    excludeListingIds: string[],
    categoryId?: string,
  ): Promise<Listing[]> {
    const supabase = await createClient();

    // Extract user preferences
    const viewedListings = (userBehavior.viewed_listings as any[]) || [];
    const savedListings = (userBehavior.saved_listings as any[]) || [];
    const purchasedListings = (userBehavior.purchased_listings as any[]) || [];
    const categoryPreferences =
      (userBehavior.category_preferences as Record<string, number>) || {};
    const locationPreferences =
      (userBehavior.location_preferences as string[]) || [];

    // Get all interacted listing IDs
    const interactedIds = [
      ...viewedListings.map((v: any) => v.listing_id),
      ...savedListings.map((s: any) => s.listing_id),
      ...purchasedListings.map((p: any) => p.listing_id),
    ];

    // Exclude purchased and already interacted listings
    const allExcludedIds = [
      ...excludeListingIds,
      ...purchasedListings.map((p: any) => p.listing_id),
    ];

    // Try vector-based recommendations first if we have browsing history
    if (interactedIds.length > 0) {
      try {
        // Fetch titles and descriptions of interacted listings
        const { data: interactedListings } = await supabase
          .from("listings")
          .select("title, description")
          .in("id", interactedIds.slice(-10)); // Last 10 interactions

        if (interactedListings && interactedListings.length > 0) {
          // Generate user embedding from browsing history
          const { generateUserEmbedding } = await import("./embeddings");
          const listingTexts = interactedListings.map(
            (l: any) => `${l.title}\n${l.description || ""}`,
          );
          const userEmbedding = await generateUserEmbedding(listingTexts);

          // Use vector similarity for recommendations
          const { data: vectorResults } = await supabase.rpc(
            "recommend_listings",
            {
              user_embedding: JSON.stringify(userEmbedding), // Convert to string for pgvector
              user_id_param: userBehavior.user_id,
              match_count: limit * 2,
            },
          );

          if (vectorResults && vectorResults.length > 0) {
            // Apply additional filters
            let filteredResults = vectorResults;

            if (categoryId) {
              filteredResults = filteredResults.filter(
                (r: any) => r.category_id === categoryId,
              );
            }

            if (allExcludedIds.length > 0) {
              filteredResults = filteredResults.filter(
                (r: any) => !allExcludedIds.includes(r.id),
              );
            }

            // Apply price range filter
            if (userBehavior.price_range_min && userBehavior.price_range_max) {
              filteredResults = filteredResults.filter(
                (r: any) =>
                  r.price >= userBehavior.price_range_min! &&
                  r.price <= userBehavior.price_range_max!,
              );
            }

            // Fetch full listing data for the filtered results
            const listingIds = filteredResults.slice(0, limit).map((r: any) => r.id);
            const { data: fullListings } = await supabase
              .from("listings")
              .select("*")
              .in("id", listingIds);

            // Return top results with full data
            return (fullListings || []) as Listing[];
          }
        }
      } catch (error) {
        console.error("Vector-based recommendations failed:", error);
        // Fall through to traditional collaborative filtering
      }
    }

    // Fallback to traditional collaborative filtering
    // Build query
    let query = supabase.from("listings").select("*").eq("status", "active");

    // Exclude purchased items (Requirement 7.9)
    if (allExcludedIds.length > 0) {
      query = query.not("id", "in", `(${allExcludedIds.join(",")})`);
    }

    // Filter by category if specified
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    } else {
      // Filter by preferred categories
      const topCategories = Object.entries(categoryPreferences)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([cat]) => cat);

      if (topCategories.length > 0) {
        query = query.in("category_id", topCategories);
      }
    }

    // Filter by price range (Requirement 7.5)
    if (userBehavior.price_range_min && userBehavior.price_range_max) {
      query = query
        .gte("price", userBehavior.price_range_min)
        .lte("price", userBehavior.price_range_max);
    }

    // Filter by location preferences (Requirement 7.5)
    if (locationPreferences.length > 0) {
      // Use the first location preference for filtering
      query = query.ilike("location", `%${locationPreferences[0]}%`);
    }

    // Get recommendations
    const { data: listings } = await query
      .order("views_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit * 2); // Get more to allow for filtering

    if (!listings || listings.length === 0) {
      return [];
    }

    // Score and rank listings using collaborative filtering
    const scoredListings = listings.map((listing) => {
      let score = 0;

      // Category match score
      const categoryScore = categoryPreferences[listing.category_id || ""] || 0;
      score += categoryScore * 10;

      // Price range match score
      if (
        listing.price &&
        listing.price >= (userBehavior.price_range_min || 0) &&
        listing.price <= (userBehavior.price_range_max || 999999999)
      ) {
        score += 50;
      }

      // Location match score
      const listingLocation = listing.state || listing.lga || "";
      if (
        locationPreferences.some((loc) =>
          listingLocation.toLowerCase().includes(loc.toLowerCase()),
        )
      ) {
        score += 30;
      }

      // Popularity score (views)
      score += Math.log10((listing.views_count || 0) + 1) * 5;

      // Recency score
      const daysOld = listing.created_at
        ? Math.max(
            1,
            (Date.now() - new Date(listing.created_at).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 30;
      score += 20 / Math.log10(daysOld + 1);

      return { listing, score };
    });

    // Sort by score and return top results
    return scoredListings
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.listing) as Listing[];
  }

  /**
   * Calculate confidence score for recommendations
   */
  private static calculateConfidence(behavior: UserBehavior): number {
    const viewedCount = ((behavior.viewed_listings as any[]) || []).length;
    const savedCount = ((behavior.saved_listings as any[]) || []).length;
    const purchasedCount = ((behavior.purchased_listings as any[]) || [])
      .length;
    const searchCount = ((behavior.search_queries as any[]) || []).length;

    const totalInteractions =
      viewedCount + savedCount * 2 + purchasedCount * 3 + searchCount;

    // Confidence increases with more interactions, capped at 0.95
    return Math.min(0.95, 0.5 + totalInteractions / 200);
  }

  /**
   * Get user behavior data
   */
  static async getUserBehavior(userId: string): Promise<UserBehavior | null> {
    const supabase = await createClient();

    const { data } = await supabase
      .from("user_behaviors")
      .select("*")
      .eq("user_id", userId)
      .single();

    return data;
  }

  /**
   * Initialize user behavior record
   */
  static async initializeUserBehavior(userId: string): Promise<void> {
    const supabase = await createClient();

    await supabase.rpc("initialize_user_behavior", { p_user_id: userId });
  }
}
