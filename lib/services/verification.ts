/**
 * Verification Service
 *
 * Manages seller verification badges including:
 * - Badge tier management (basic, trusted, power)
 * - Badge criteria checking
 * - Badge awarding and revocation
 *
 * Requirements: 15.1, 15.2, 15.7
 * Tasks: 27.2
 */

import { createClient } from "@/lib/supabase/server";
import { BADGE_CRITERIA, type BadgeTier } from "./verification-constants";

export type { BadgeTier } from "./verification-constants";
export { BADGE_CRITERIA } from "./verification-constants";

export interface VerificationBadge {
  id: string;
  user_id: string;
  tier: BadgeTier;
  phone_verified: boolean;
  nin_verified: boolean;
  video_verified: boolean;
  transaction_count: number;
  average_rating: number | null;
  awarded_at: string | null;
  revoked_at: string | null;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
}

export interface SellerStats {
  transaction_count: number;
  average_rating: number | null;
}

export interface BadgeCheckResult {
  currentTier: BadgeTier;
  eligibleTier: BadgeTier;
  shouldUpdate: boolean;
  reason: string;
  stats: SellerStats;
}

export class VerificationService {
  /**
   * Award a badge to a seller
   * Requirement 15.1, 15.2
   *
   * @param userId - The user ID to award the badge to
   * @param tier - The badge tier to award
   * @param reason - Reason for awarding the badge
   * @param changedBy - User ID of admin who made the change (optional, for manual awards)
   * @returns The updated verification badge
   */
  static async awardBadge(
    userId: string,
    tier: BadgeTier,
    reason: string,
    changedBy?: string,
  ): Promise<VerificationBadge | null> {
    const supabase = await createClient();

    // Get current badge status
    const { data: currentBadge, error: fetchError } = await supabase
      .from("verification_badges")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching current badge:", fetchError);
      return null;
    }

    const previousTier = currentBadge?.tier || "none";

    // Don't award if already at this tier or higher
    const tierOrder = ["none", "basic", "trusted", "power"];
    const currentTierIndex = tierOrder.indexOf(previousTier);
    const newTierIndex = tierOrder.indexOf(tier);

    if (newTierIndex <= currentTierIndex && tier !== "none") {
      console.log(
        `User ${userId} already has tier ${previousTier}, not awarding ${tier}`,
      );
      return currentBadge as VerificationBadge;
    }

    // Update the badge
    const { data: updatedBadge, error: updateError } = await supabase
      .from("verification_badges")
      .update({
        tier,
        awarded_at: tier !== "none" ? new Date().toISOString() : null,
        revoked_at: null, // Clear revocation when awarding
        last_checked_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating badge:", updateError);
      return null;
    }

    // Record in badge history
    await supabase.from("badge_history").insert({
      user_id: userId,
      previous_tier: previousTier,
      new_tier: tier,
      reason,
      transaction_count: currentBadge?.transaction_count || 0,
      average_rating: currentBadge?.average_rating || null,
      changed_by: changedBy || null,
    });

    // Send congratulatory notification if tier upgraded (Requirement 15.10)
    if (newTierIndex > currentTierIndex && tier !== "none") {
      await this.sendBadgeNotification(userId, tier);
    }

    return updatedBadge as VerificationBadge;
  }

  /**
   * Check if a seller meets badge criteria and determine eligible tier
   * Requirement 15.2, 15.4, 15.5
   *
   * @param userId - The user ID to check
   * @returns Badge check result with eligibility information
   */
  static async checkBadgeCriteria(
    userId: string,
  ): Promise<BadgeCheckResult | null> {
    const supabase = await createClient();

    // Get current badge status
    const { data: badge, error: badgeError } = await supabase
      .from("verification_badges")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (badgeError) {
      console.error("Error fetching badge:", badgeError);
      return null;
    }

    // Calculate seller statistics
    const { data: statsData, error: statsError } = await supabase.rpc(
      "calculate_seller_stats",
      { seller_user_id: userId },
    );

    if (statsError) {
      console.error("Error calculating seller stats:", statsError);
      return null;
    }

    const stats: SellerStats = {
      transaction_count: statsData?.[0]?.transaction_count || 0,
      average_rating: statsData?.[0]?.average_rating || null,
    };

    // Update badge with latest stats
    await supabase
      .from("verification_badges")
      .update({
        transaction_count: stats.transaction_count,
        average_rating: stats.average_rating,
        last_checked_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Determine eligible tier based on criteria
    let eligibleTier: BadgeTier = "none";
    let reason = "";

    // Check Power Seller criteria (highest tier)
    if (
      badge.phone_verified &&
      badge.nin_verified &&
      badge.video_verified &&
      stats.transaction_count >= BADGE_CRITERIA.power.transactions &&
      stats.average_rating !== null &&
      stats.average_rating >= BADGE_CRITERIA.power.minRating
    ) {
      eligibleTier = "power";
      reason = `Meets Power Seller criteria: ${stats.transaction_count} transactions, ${stats.average_rating} rating`;
    }
    // Check Trusted Seller criteria
    else if (
      badge.phone_verified &&
      badge.nin_verified &&
      badge.video_verified &&
      stats.transaction_count >= BADGE_CRITERIA.trusted.transactions &&
      stats.average_rating !== null &&
      stats.average_rating >= BADGE_CRITERIA.trusted.minRating
    ) {
      eligibleTier = "trusted";
      reason = `Meets Trusted Seller criteria: ${stats.transaction_count} transactions, ${stats.average_rating} rating`;
    }
    // Check Basic Verified criteria
    else if (
      badge.phone_verified &&
      badge.nin_verified &&
      badge.video_verified
    ) {
      eligibleTier = "basic";
      reason = "Completed all verification types (phone, NIN, video)";
    }
    // Check if badge should be revoked (rating dropped below threshold)
    else if (badge.tier !== "none") {
      eligibleTier = "none";
      if (
        !badge.phone_verified ||
        !badge.nin_verified ||
        !badge.video_verified
      ) {
        reason = "Verification incomplete";
      } else if (stats.average_rating !== null) {
        if (
          badge.tier === "power" &&
          stats.average_rating < BADGE_CRITERIA.power.minRating
        ) {
          reason = `Rating dropped below ${BADGE_CRITERIA.power.minRating}`;
        } else if (
          badge.tier === "trusted" &&
          stats.average_rating < BADGE_CRITERIA.trusted.minRating
        ) {
          reason = `Rating dropped below ${BADGE_CRITERIA.trusted.minRating}`;
        }
      }
    }

    const shouldUpdate = eligibleTier !== badge.tier;

    return {
      currentTier: badge.tier as BadgeTier,
      eligibleTier,
      shouldUpdate,
      reason,
      stats,
    };
  }

  /**
   * Revoke a badge from a seller
   * Requirement 15.7
   *
   * @param userId - The user ID to revoke the badge from
   * @param reason - Reason for revocation (e.g., 'rating_drop', 'violation')
   * @param changedBy - User ID of admin who made the change (optional)
   * @returns The updated verification badge
   */
  static async revokeBadge(
    userId: string,
    reason: string,
    changedBy?: string,
  ): Promise<VerificationBadge | null> {
    const supabase = await createClient();

    // Get current badge status
    const { data: currentBadge, error: fetchError } = await supabase
      .from("verification_badges")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching current badge:", fetchError);
      return null;
    }

    const previousTier = currentBadge?.tier || "none";

    // Don't revoke if already at 'none'
    if (previousTier === "none") {
      console.log(`User ${userId} already has no badge`);
      return currentBadge as VerificationBadge;
    }

    // Update the badge to 'none'
    const { data: updatedBadge, error: updateError } = await supabase
      .from("verification_badges")
      .update({
        tier: "none",
        revoked_at: new Date().toISOString(),
        last_checked_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error revoking badge:", updateError);
      return null;
    }

    // Record in badge history
    await supabase.from("badge_history").insert({
      user_id: userId,
      previous_tier: previousTier,
      new_tier: "none",
      reason,
      transaction_count: currentBadge?.transaction_count || 0,
      average_rating: currentBadge?.average_rating || null,
      changed_by: changedBy || null,
    });

    // Send notification about revocation
    await this.sendRevocationNotification(
      userId,
      previousTier as BadgeTier,
      reason,
    );

    return updatedBadge as VerificationBadge;
  }

  /**
   * Get badge for a user
   *
   * @param userId - The user ID
   * @returns The verification badge or null
   */
  static async getBadge(userId: string): Promise<VerificationBadge | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("verification_badges")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching badge:", error);
      return null;
    }

    return data as VerificationBadge;
  }

  /**
   * Send congratulatory notification when seller achieves new badge tier
   * Requirement 15.10
   *
   * @param userId - The user ID
   * @param tier - The new badge tier
   */
  private static async sendBadgeNotification(
    userId: string,
    tier: BadgeTier,
  ): Promise<void> {
    const supabase = await createClient();

    const tierNames: Record<BadgeTier, string> = {
      none: "",
      basic: "Basic Verified",
      trusted: "Trusted Seller",
      power: "Power Seller",
    };

    const tierMessages: Record<BadgeTier, string> = {
      none: "",
      basic:
        "Congratulations! You are now a verified seller. Your listings will be prioritized in search results.",
      trusted:
        "Congratulations! You have earned the Trusted Seller badge. Keep up the great work!",
      power:
        "Congratulations! You have achieved Power Seller status. You are among the top sellers on FindAm!",
    };

    if (tier === "none") return;

    await supabase.from("notifications").insert({
      user_id: userId,
      type: "badge_awarded",
      title: `🎉 ${tierNames[tier]} Badge Earned!`,
      message: tierMessages[tier],
      link: "/profile",
    });
  }

  /**
   * Send notification when badge is revoked
   *
   * @param userId - The user ID
   * @param previousTier - The previous badge tier
   * @param reason - Reason for revocation
   */
  private static async sendRevocationNotification(
    userId: string,
    previousTier: BadgeTier,
    reason: string,
  ): Promise<void> {
    const supabase = await createClient();

    const tierNames: Record<BadgeTier, string> = {
      none: "",
      basic: "Basic Verified",
      trusted: "Trusted Seller",
      power: "Power Seller",
    };

    if (previousTier === "none") return;

    await supabase.from("notifications").insert({
      user_id: userId,
      type: "badge_revoked",
      title: `${tierNames[previousTier]} Badge Revoked`,
      message: `Your ${tierNames[previousTier]} badge has been revoked. Reason: ${reason}`,
      link: "/profile",
    });
  }
}
