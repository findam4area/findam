/**
 * Storefront Service
 * Handles custom seller storefront operations including creation, updates, and retrieval
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.8
 */

import { createClient } from "@/lib/supabase/server";
import type {
  Storefront,
  StorefrontData,
  UpdateStorefrontRequest,
  User,
  Listing,
  Review,
} from "@/lib/types";

export class StorefrontService {
  /**
   * Get storefront by custom URL (username)
   * Requirements: 9.1, 9.2, 9.3, 9.5
   */
  async getStorefront(customUrl: string): Promise<StorefrontData | null> {
    const supabase = await createClient();

    // Get storefront by custom_url
    const { data: storefront, error: storefrontError } = await (supabase as any)
      .from("storefronts")
      .select("*")
      .eq("custom_url", customUrl)
      .eq("is_active", true)
      .single();

    if (storefrontError) {
      if (storefrontError.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch storefront: ${storefrontError.message}`);
    }

    // Get seller user data
    const { data: seller, error: sellerError } = await (supabase as any)
      .from("users")
      .select("*")
      .eq("id", storefront.user_id)
      .single();

    if (sellerError) {
      throw new Error(`Failed to fetch seller: ${sellerError.message}`);
    }

    // Get all active listings
    const { data: listings, error: listingsError } = await (supabase as any)
      .from("listings")
      .select(
        `
        *,
        listing_media (*)
      `,
      )
      .eq("user_id", storefront.user_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (listingsError) {
      throw new Error(`Failed to fetch listings: ${listingsError.message}`);
    }

    // Get featured listings
    const featuredListings =
      storefront.featured_listings && storefront.featured_listings.length > 0
        ? (listings || []).filter((listing: any) =>
            storefront.featured_listings.includes(listing.id),
          )
        : [];

    // Get reviews
    const { data: reviews, error: reviewsError } = await (supabase as any)
      .from("reviews")
      .select("*")
      .eq("reviewed_user_id", storefront.user_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (reviewsError) {
      throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
    }

    // Calculate statistics
    const averageRating =
      reviews && reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          reviews.length
        : 0;

    // Get total sales count (completed escrow transactions)
    const { count: totalSales } = await (supabase as any)
      .from("escrow_transactions")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", storefront.user_id)
      .eq("status", "released");

    // Calculate response time (placeholder - would need message data)
    const responseTime = "< 1 hour";

    const storefrontData: StorefrontData = {
      storefront: storefront as Storefront,
      seller: seller as User,
      listings: (listings || []) as Listing[],
      featuredListings: featuredListings as Listing[],
      reviews: (reviews || []) as Review[],
      stats: {
        totalSales: totalSales || 0,
        responseTime,
        memberSince: seller.created_at,
        followerCount: storefront.follower_count || 0,
        averageRating,
        reviewCount: reviews?.length || 0,
      },
    };

    return storefrontData;
  }

  /**
   * Get or create storefront for a user
   * Requirements: 9.1
   */
  async getOrCreateStorefront(userId: string): Promise<Storefront> {
    const supabase = await createClient();

    // Try to get existing storefront
    let { data: storefront, error: fetchError } = await (supabase as any)
      .from("storefronts")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(`Failed to fetch storefront: ${fetchError.message}`);
    }

    // If storefront doesn't exist, create it
    if (!storefront) {
      // Get user data to use username as custom_url
      const { data: user, error: userError } = await (supabase as any)
        .from("users")
        .select("username")
        .eq("id", userId)
        .single();

      if (userError) {
        throw new Error(`Failed to fetch user: ${userError.message}`);
      }

      // Create storefront with username as custom_url
      const { data: newStorefront, error: createError } = await (
        supabase as any
      )
        .from("storefronts")
        .insert({
          user_id: userId,
          custom_url: user.username,
          theme_color: "#3B82F6", // Default blue
          featured_listings: [],
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create storefront: ${createError.message}`);
      }

      storefront = newStorefront;
    }

    return storefront as Storefront;
  }

  /**
   * Update storefront customization
   * Requirements: 9.4, 9.8
   */
  async updateStorefront(
    userId: string,
    updates: UpdateStorefrontRequest,
  ): Promise<Storefront> {
    const supabase = await createClient();

    // Get existing storefront
    const storefront = await this.getOrCreateStorefront(userId);

    // Validate custom_url if provided (Requirements 9.1, 9.4)
    if (updates.custom_domain) {
      // Custom domain validation for premium users
      // This would require DNS verification in production
      // For now, just store the value
    }

    // Validate theme_color format
    if (updates.theme_color && !/^#[0-9A-Fa-f]{6}$/.test(updates.theme_color)) {
      throw new Error("Invalid theme color format. Use hex format: #RRGGBB");
    }

    // Validate featured_listings (max 6)
    if (updates.featured_listings && updates.featured_listings.length > 6) {
      throw new Error("Maximum 6 featured listings allowed");
    }

    // Validate featured listings belong to user
    if (updates.featured_listings && updates.featured_listings.length > 0) {
      const { data: listings, error: listingsError } = await (supabase as any)
        .from("listings")
        .select("id")
        .eq("user_id", userId)
        .in("id", updates.featured_listings);

      if (listingsError) {
        throw new Error(
          `Failed to validate listings: ${listingsError.message}`,
        );
      }

      if (listings.length !== updates.featured_listings.length) {
        throw new Error("Some featured listings do not belong to this user");
      }
    }

    // Update storefront
    const { data: updatedStorefront, error: updateError } = await (
      supabase as any
    )
      .from("storefronts")
      .update({
        display_name: updates.display_name,
        bio: updates.bio,
        banner_url: updates.banner_url,
        theme_color: updates.theme_color,
        featured_listings: updates.featured_listings,
        custom_domain: updates.custom_domain,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storefront.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update storefront: ${updateError.message}`);
    }

    return updatedStorefront as Storefront;
  }

  /**
   * Follow a storefront
   * Requirements: 9.6
   */
  async followStorefront(
    storefrontId: string,
    followerUserId: string,
  ): Promise<void> {
    const supabase = await createClient();

    // Check if already following
    const { data: existing } = await (supabase as any)
      .from("storefront_followers")
      .select("id")
      .eq("storefront_id", storefrontId)
      .eq("follower_user_id", followerUserId)
      .single();

    if (existing) {
      throw new Error("Already following this storefront");
    }

    // Create follow relationship
    const { error: followError } = await (supabase as any)
      .from("storefront_followers")
      .insert({
        storefront_id: storefrontId,
        follower_user_id: followerUserId,
      });

    if (followError) {
      throw new Error(`Failed to follow storefront: ${followError.message}`);
    }

    // Increment follower count
    const { error: updateError } = await (supabase as any).rpc(
      "increment_storefront_followers",
      { storefront_id: storefrontId },
    );

    if (updateError) {
      console.error("Failed to increment follower count:", updateError);
    }
  }

  /**
   * Unfollow a storefront
   * Requirements: 9.6
   */
  async unfollowStorefront(
    storefrontId: string,
    followerUserId: string,
  ): Promise<void> {
    const supabase = await createClient();

    // Delete follow relationship
    const { error: unfollowError } = await (supabase as any)
      .from("storefront_followers")
      .delete()
      .eq("storefront_id", storefrontId)
      .eq("follower_user_id", followerUserId);

    if (unfollowError) {
      throw new Error(
        `Failed to unfollow storefront: ${unfollowError.message}`,
      );
    }

    // Decrement follower count
    const { error: updateError } = await (supabase as any).rpc(
      "decrement_storefront_followers",
      { storefront_id: storefrontId },
    );

    if (updateError) {
      console.error("Failed to decrement follower count:", updateError);
    }
  }

  /**
   * Check if user is following a storefront
   * Requirements: 9.6
   */
  async isFollowing(
    storefrontId: string,
    followerUserId: string,
  ): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("storefront_followers")
      .select("id")
      .eq("storefront_id", storefrontId)
      .eq("follower_user_id", followerUserId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to check follow status: ${error.message}`);
    }

    return !!data;
  }
}

// Export singleton instance
export const storefrontService = new StorefrontService();
