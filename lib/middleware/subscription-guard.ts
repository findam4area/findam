/**
 * Subscription Feature Guard
 * Middleware to check subscription feature access
 * Requirements: 16.2, 16.3, 16.4, 16.6
 */

import { createClient } from "@/lib/supabase/server";
import {
  subscriptionService,
  type PlanFeatures,
} from "@/lib/services/subscription";

export class SubscriptionGuard {
  /**
   * Check if user has unlimited listings
   * Requirements: 16.2
   */
  static async hasUnlimitedListings(userId: string): Promise<boolean> {
    return await subscriptionService.hasFeatureAccess(userId, "maxListings");
  }

  /**
   * Check if user has advanced analytics
   * Requirements: 16.3
   */
  static async hasAdvancedAnalytics(userId: string): Promise<boolean> {
    return await subscriptionService.hasFeatureAccess(
      userId,
      "advancedAnalytics",
    );
  }

  /**
   * Check if user has priority support
   * Requirements: 16.4
   */
  static async hasPrioritySupport(userId: string): Promise<boolean> {
    return await subscriptionService.hasFeatureAccess(
      userId,
      "prioritySupport",
    );
  }

  /**
   * Check if user has custom domain
   * Requirements: 16.6
   */
  static async hasCustomDomain(userId: string): Promise<boolean> {
    return await subscriptionService.hasFeatureAccess(userId, "customDomain");
  }

  /**
   * Check if user has CSV export
   * Requirements: 16.3
   */
  static async hasCsvExport(userId: string): Promise<boolean> {
    return await subscriptionService.hasFeatureAccess(userId, "csvExport");
  }

  /**
   * Check if user can create more listings
   * Requirements: 16.2
   */
  static async canCreateListing(userId: string): Promise<boolean> {
    const supabase = await createClient();

    // Get subscription
    const subscription = await subscriptionService.getSubscription(userId);
    if (!subscription) {
      return false;
    }

    // Check if unlimited
    if (subscription.features.unlimited_listings) {
      return true;
    }

    // Count active listings
    const { count, error } = await (supabase as any)
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active");

    if (error) {
      throw new Error(`Failed to count listings: ${error.message}`);
    }

    // Basic plan allows 10 listings
    return (count || 0) < 10;
  }

  /**
   * Get remaining free boosts
   * Requirements: 16.5
   */
  static async getRemainingFreeBoosts(userId: string): Promise<number> {
    const subscription = await subscriptionService.getSubscription(userId);
    if (!subscription) {
      return 0;
    }

    return subscription.free_boosts_remaining;
  }

  /**
   * Check if user has free boosts available
   * Requirements: 16.5
   */
  static async hasFreeBoosts(userId: string): Promise<boolean> {
    const remaining = await this.getRemainingFreeBoosts(userId);
    return remaining > 0;
  }
}
