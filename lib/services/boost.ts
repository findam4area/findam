/**
 * Boost Service
 * Handles premium listing boost operations including purchase, ranking, and expiration
 * Requirements: 14.1, 14.2, 14.6, 14.8, 14.9, 14.10
 * Tasks: 34.1, 34.2, 34.5, 34.7, 34.9
 */

import { createClient } from "@/lib/supabase/server";
import { paystackClient } from "@/lib/paystack/client";
import type {
  Boost,
  BoostPackage,
  BoostPerformance,
  PurchaseBoostRequest,
  PurchaseBoostResponse,
  BoostAnalytics,
} from "@/lib/types";
import { getBoostPackageDetails, validateBoostPackage } from "@/lib/types";

export class BoostService {
  /**
   * Purchase a boost for a listing
   * Requirements: 14.1, 14.9, 16.5
   * Task: 34.1, 35.5
   */
  async purchaseBoost(params: {
    user_id: string;
    listing_id: string;
    package_type: "basic" | "standard" | "premium";
    email: string;
    use_free_boost?: boolean;
  }): Promise<PurchaseBoostResponse> {
    const supabase = await createClient();

    // Validate package type
    if (!validateBoostPackage(params.package_type)) {
      throw new Error("Invalid boost package type");
    }

    // Get package details
    const packageDetails = getBoostPackageDetails(params.package_type);

    // Check if user wants to use free boost
    if (params.use_free_boost) {
      const { subscriptionService } = await import("./subscription");
      const subscription = await subscriptionService.getSubscription(
        params.user_id,
      );

      if (subscription && subscription.free_boosts_remaining > 0) {
        // Use free boost - no payment required
        return await this.createFreeBoost({
          user_id: params.user_id,
          listing_id: params.listing_id,
          package_type: params.package_type,
        });
      } else {
        throw new Error("No free boosts available");
      }
    }

    // Verify listing exists and belongs to user
    const { data: listing, error: listingError } = await (supabase as any)
      .from("listings")
      .select("id, user_id, title")
      .eq("id", params.listing_id)
      .eq("user_id", params.user_id)
      .single();

    if (listingError || !listing) {
      throw new Error("Listing not found or access denied");
    }

    // Generate unique reference
    const reference = `boost_${Date.now()}_${params.listing_id.substring(0, 8)}`;

    // Calculate expiration time
    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + packageDetails.duration * 60 * 60 * 1000,
    );

    // Create boost record with pending payment status
    const { data: boost, error: boostError } = await (supabase as any)
      .from("boosts")
      .insert({
        listing_id: params.listing_id,
        user_id: params.user_id,
        package_type: params.package_type,
        price: packageDetails.price,
        duration_hours: packageDetails.duration,
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "active", // Will be activated after payment confirmation
        payment_status: "pending",
        paystack_reference: reference,
        views_gained: 0,
        impressions_gained: 0,
        messages_received: 0,
        expiration_notification_sent: false,
      })
      .select()
      .single();

    if (boostError) {
      throw new Error(`Failed to create boost: ${boostError.message}`);
    }

    // Initialize Paystack payment
    const paymentResponse = await paystackClient.initializeTransaction({
      email: params.email,
      amount: packageDetails.price * 100, // Convert to kobo
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/boosts/verify?reference=${reference}`,
      metadata: {
        boost_id: boost.id,
        listing_id: params.listing_id,
        user_id: params.user_id,
        package_type: params.package_type,
        listing_title: listing.title,
      },
    });

    return {
      boost: boost as Boost,
      payment_url: paymentResponse.data.authorization_url,
      access_code: paymentResponse.data.access_code,
      reference: paymentResponse.data.reference,
    };
  }

  /**
   * Confirm boost payment and activate boost
   * Requirements: 14.1, 14.9
   * Task: 34.1
   */
  async confirmBoostPayment(params: { reference: string }): Promise<Boost> {
    const supabase = await createClient();

    // Verify payment with Paystack
    const paymentVerification = await paystackClient.verifyTransaction(
      params.reference,
    );

    if (paymentVerification.data.status !== "success") {
      throw new Error("Payment verification failed");
    }

    // Get boost record
    const { data: boost, error: fetchError } = await (supabase as any)
      .from("boosts")
      .select("*")
      .eq("paystack_reference", params.reference)
      .single();

    if (fetchError || !boost) {
      throw new Error("Boost not found");
    }

    // Update boost payment status
    const { data: updatedBoost, error: updateError } = await (supabase as any)
      .from("boosts")
      .update({
        payment_status: "completed",
        status: "active",
      })
      .eq("id", boost.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to activate boost: ${updateError.message}`);
    }

    // Update listing boost status
    await (supabase as any)
      .from("listings")
      .update({
        is_boosted: true,
        boost_expires_at: boost.expires_at,
      })
      .eq("id", boost.listing_id);

    return updatedBoost as Boost;
  }

  /**
   * Get active boosts for a listing
   * Requirements: 14.2
   * Task: 34.2
   */
  async getActiveBoosts(listingId: string): Promise<Boost[]> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("boosts")
      .select("*")
      .eq("listing_id", listingId)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active boosts: ${error.message}`);
    }

    return (data as Boost[]) || [];
  }

  /**
   * Check if a listing is currently boosted
   * Requirements: 14.2
   * Task: 34.2
   */
  async isListingBoosted(listingId: string): Promise<boolean> {
    const activeBoosts = await this.getActiveBoosts(listingId);
    return activeBoosts.length > 0;
  }

  /**
   * Get boosted listings for ranking
   * Requirements: 14.2
   * Task: 34.2
   */
  async getBoostedListings(params: {
    category_id?: string;
    limit?: number;
  }): Promise<string[]> {
    const supabase = await createClient();

    let query = (supabase as any)
      .from("boosts")
      .select("listing_id, listings!inner(id, category_id)")
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .order("started_at", { ascending: false });

    if (params.category_id) {
      query = query.eq("listings.category_id", params.category_id);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch boosted listings: ${error.message}`);
    }

    return (data || []).map((item: any) => item.listing_id);
  }

  /**
   * Handle boost expiration
   * Requirements: 14.6
   * Task: 34.5
   */
  async expireBoosts(): Promise<{ expired: number }> {
    const supabase = await createClient();

    // Find expired boosts
    const { data: expiredBoosts, error: fetchError } = await (supabase as any)
      .from("boosts")
      .select("id, listing_id")
      .eq("status", "active")
      .lt("expires_at", new Date().toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch expired boosts: ${fetchError.message}`);
    }

    if (!expiredBoosts || expiredBoosts.length === 0) {
      return { expired: 0 };
    }

    // Update boost status to expired
    const { error: updateError } = await (supabase as any)
      .from("boosts")
      .update({ status: "expired" })
      .in(
        "id",
        expiredBoosts.map((b: any) => b.id),
      );

    if (updateError) {
      throw new Error(`Failed to expire boosts: ${updateError.message}`);
    }

    // Update listing boost status for listings with no active boosts
    for (const boost of expiredBoosts) {
      const activeBoosts = await this.getActiveBoosts(boost.listing_id);
      if (activeBoosts.length === 0) {
        await (supabase as any)
          .from("listings")
          .update({
            is_boosted: false,
            boost_expires_at: null,
          })
          .eq("id", boost.listing_id);
      }
    }

    return { expired: expiredBoosts.length };
  }

  /**
   * Send expiration notifications
   * Requirements: 14.10
   * Task: 34.7
   */
  async sendExpirationNotifications(): Promise<{ notified: number }> {
    const supabase = await createClient();

    // Find boosts expiring in 6 hours that haven't been notified
    const sixHoursFromNow = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const now = new Date();

    const { data: expiringBoosts, error: fetchError } = await (supabase as any)
      .from("boosts")
      .select(
        "id, listing_id, user_id, expires_at, package_type, listings!inner(title)",
      )
      .eq("status", "active")
      .eq("expiration_notification_sent", false)
      .gte("expires_at", now.toISOString())
      .lte("expires_at", sixHoursFromNow.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch expiring boosts: ${fetchError.message}`);
    }

    if (!expiringBoosts || expiringBoosts.length === 0) {
      return { notified: 0 };
    }

    // Send notifications for each expiring boost
    for (const boost of expiringBoosts) {
      // Create notification
      await (supabase as any).from("notifications").insert({
        user_id: boost.user_id,
        type: "boost_expiring",
        title: "Boost Expiring Soon",
        message: `Your boost for "${boost.listings.title}" will expire in 6 hours. Extend now to keep your listing at the top!`,
        link: `/listing/${boost.listing_id}?extend_boost=true`,
        is_read: false,
      });

      // Mark notification as sent
      await (supabase as any)
        .from("boosts")
        .update({ expiration_notification_sent: true })
        .eq("id", boost.id);
    }

    return { notified: expiringBoosts.length };
  }

  /**
   * Track boost performance
   * Requirements: 14.8
   * Task: 34.9
   */
  async trackBoostPerformance(params: {
    listing_id: string;
    metric: "view" | "impression" | "message";
  }): Promise<void> {
    const supabase = await createClient();

    // Get active boosts for the listing
    const activeBoosts = await this.getActiveBoosts(params.listing_id);

    if (activeBoosts.length === 0) {
      return; // No active boosts to track
    }

    // Update performance metrics for all active boosts
    for (const boost of activeBoosts) {
      const updateField =
        params.metric === "view"
          ? "views_gained"
          : params.metric === "impression"
            ? "impressions_gained"
            : "messages_received";

      await (supabase as any).rpc("increment_boost_metric", {
        boost_id: boost.id,
        metric_field: updateField,
      });
    }
  }

  /**
   * Get boost performance analytics
   * Requirements: 14.8
   * Task: 34.9
   */
  async getBoostPerformance(boostId: string): Promise<BoostPerformance> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("boosts")
      .select(
        "id, listing_id, views_gained, impressions_gained, messages_received, started_at, expires_at, status",
      )
      .eq("id", boostId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch boost performance: ${error.message}`);
    }

    return data as BoostPerformance;
  }

  /**
   * Get user's boost analytics
   * Requirements: 14.8
   * Task: 34.9
   */
  async getUserBoostAnalytics(userId: string): Promise<BoostAnalytics> {
    const supabase = await createClient();

    const { data: boosts, error } = await (supabase as any)
      .from("boosts")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to fetch boost analytics: ${error.message}`);
    }

    const allBoosts = (boosts as Boost[]) || [];
    const activeBoosts = allBoosts.filter((b) => b.status === "active");

    const totalViewsGained = allBoosts.reduce(
      (sum, b) => sum + b.views_gained,
      0,
    );
    const totalImpressionsGained = allBoosts.reduce(
      (sum, b) => sum + b.impressions_gained,
      0,
    );
    const totalMessagesReceived = allBoosts.reduce(
      (sum, b) => sum + b.messages_received,
      0,
    );
    const totalSpent = allBoosts
      .filter((b) => b.payment_status === "completed")
      .reduce((sum, b) => sum + b.price, 0);

    return {
      total_boosts: allBoosts.length,
      active_boosts: activeBoosts.length,
      total_views_gained: totalViewsGained,
      total_impressions_gained: totalImpressionsGained,
      total_messages_received: totalMessagesReceived,
      total_spent: totalSpent,
      average_performance: {
        views_per_boost:
          allBoosts.length > 0 ? totalViewsGained / allBoosts.length : 0,
        impressions_per_boost:
          allBoosts.length > 0 ? totalImpressionsGained / allBoosts.length : 0,
        messages_per_boost:
          allBoosts.length > 0 ? totalMessagesReceived / allBoosts.length : 0,
      },
    };
  }

  /**
   * Get boost by ID
   */
  async getBoost(boostId: string): Promise<Boost | null> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("boosts")
      .select("*")
      .eq("id", boostId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch boost: ${error.message}`);
    }

    return data as Boost;
  }

  /**
   * Get user's boosts
   */
  async getUserBoosts(params: {
    user_id: string;
    status?: "active" | "expired" | "cancelled";
    limit?: number;
    offset?: number;
  }): Promise<Boost[]> {
    const supabase = await createClient();

    let query = (supabase as any)
      .from("boosts")
      .select("*, listings!inner(id, title, thumbnail_url)")
      .eq("user_id", params.user_id);

    if (params.status) {
      query = query.eq("status", params.status);
    }

    query = query
      .order("created_at", { ascending: false })
      .limit(params.limit || 50)
      .range(
        params.offset || 0,
        (params.offset || 0) + (params.limit || 50) - 1,
      );

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch user boosts: ${error.message}`);
    }

    return (data as Boost[]) || [];
  }

  /**
   * Create a free boost from subscription
   * Requirements: 16.5
   * Task: 35.5
   */
  async createFreeBoost(params: {
    user_id: string;
    listing_id: string;
    package_type: "basic" | "standard" | "premium";
  }): Promise<PurchaseBoostResponse> {
    const supabase = await createClient();
    const { subscriptionService } = await import("./subscription");

    // Verify listing exists and belongs to user
    const { data: listing, error: listingError } = await (supabase as any)
      .from("listings")
      .select("id, user_id, title")
      .eq("id", params.listing_id)
      .eq("user_id", params.user_id)
      .single();

    if (listingError || !listing) {
      throw new Error("Listing not found or access denied");
    }

    // Get package details
    const packageDetails = getBoostPackageDetails(params.package_type);

    // Calculate expiration time
    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + packageDetails.duration * 60 * 60 * 1000,
    );

    // Generate reference for free boost
    const reference = `free_boost_${Date.now()}_${params.listing_id.substring(0, 8)}`;

    // Create boost record
    const { data: boost, error: boostError } = await (supabase as any)
      .from("boosts")
      .insert({
        listing_id: params.listing_id,
        user_id: params.user_id,
        package_type: params.package_type,
        price: 0, // Free boost
        duration_hours: packageDetails.duration,
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "active",
        payment_status: "completed",
        paystack_reference: reference,
        views_gained: 0,
        impressions_gained: 0,
        messages_received: 0,
        expiration_notification_sent: false,
      })
      .select()
      .single();

    if (boostError) {
      throw new Error(`Failed to create free boost: ${boostError.message}`);
    }

    // Deduct free boost from subscription
    await subscriptionService.useFreeBoost(params.user_id);

    // Update listing boost status
    await (supabase as any)
      .from("listings")
      .update({
        is_boosted: true,
        boost_expires_at: expiresAt.toISOString(),
      })
      .eq("id", params.listing_id);

    return {
      boost: boost as Boost,
      payment_url: "", // No payment needed
      access_code: "",
      reference,
    };
  }
}

// Export singleton instance
export const boostService = new BoostService();
