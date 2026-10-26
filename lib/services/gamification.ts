/**
 * Gamification Service
 * Handles user levels, points, achievements, and badges
 */

import { createClient } from "@/lib/supabase/client";

export interface UserLevel {
  id: string;
  user_id: string;
  level: number;
  current_points: number;
  total_points: number;
  points_to_next_level: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string | null;
  listings_posted: number;
  items_sold: number;
  items_purchased: number;
  reviews_given: number;
  referrals_made: number;
  unlocked_perks: string[];
  free_boosts_remaining: number;
}

export interface Achievement {
  id: string;
  badge_type: string;
  name: string;
  description: string;
  icon: string;
  category:
    | "milestone"
    | "streak"
    | "level"
    | "special_event"
    | "seasonal"
    | "community";
  requirement_type:
    | "listing_count"
    | "sale_count"
    | "review_count"
    | "referral_count"
    | "streak_days"
    | "level"
    | "special";
  requirement_value: number | null;
  rarity: "common" | "rare" | "epic" | "legendary";
  display_order: number;
  is_active: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  is_displayed: boolean;
  display_order: number;
  earned_at: string;
  achievement?: Achievement;
}

export interface PointsTransaction {
  points_change: number;
  activity_type: string;
  description?: string;
  reference_id?: string;
}

export interface LevelUpResult {
  leveled_up: boolean;
  new_level: number;
  unlocked_perks: string[];
  unlocked_achievements: Achievement[];
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  total_points: number;
  items_sold: number;
  items_purchased: number;
  rank: number;
}

export class GamificationService {
  private supabase = createClient();

  // Points awarded for different activities
  private readonly POINTS = {
    LISTING_POSTED: 10,
    ITEM_SOLD: 50,
    ITEM_PURCHASED: 5,
    REVIEW_GIVEN: 15,
    REFERRAL_MADE: 100,
    DAILY_LOGIN: 5,
    CHALLENGE_COMPLETED: 200,
  };

  // Perks unlocked at different levels
  private readonly LEVEL_PERKS: Record<number, string[]> = {
    5: ["priority_support"],
    10: ["free_boost_monthly"],
    15: ["reduced_fees_5"],
    20: ["custom_badge"],
    25: ["free_boost_weekly", "reduced_fees_10"],
    50: ["vip_status", "reduced_fees_15"],
  };

  /**
   * Get user level data
   */
  async getUserLevel(userId: string): Promise<UserLevel | null> {
    const { data, error } = await (this.supabase as any)
      .from("user_levels")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Failed to get user level:", error);
      return null;
    }

    return data as UserLevel;
  }

  /**
   * Add points to user and handle level ups
   */
  async addPoints(
    userId: string,
    points: number,
    activityType: string,
    description?: string,
    referenceId?: string,
  ): Promise<LevelUpResult> {
    try {
      // Call the database function to add points
      const { data, error } = await this.supabase.rpc(
        "add_user_points" as any,
        {
          p_user_id: userId,
          p_points: points,
          p_activity_type: activityType,
          p_description: description,
          p_reference_id: referenceId,
        },
      );

      if (error) {
        console.error("Failed to add points:", error);
        return {
          leveled_up: false,
          new_level: 1,
          unlocked_perks: [],
          unlocked_achievements: [],
        };
      }

      const result = data[0];
      const leveledUp = result.leveled_up;
      const newLevel = result.new_level;

      // Check for unlocked perks
      const unlockedPerks = leveledUp ? this.LEVEL_PERKS[newLevel] || [] : [];

      // Check for unlocked achievements
      const unlockedAchievements = leveledUp
        ? await this.checkLevelAchievements(userId, newLevel)
        : [];

      // Update user stats based on activity type
      await this.updateUserStats(userId, activityType);

      return {
        leveled_up: leveledUp,
        new_level: newLevel,
        unlocked_perks: unlockedPerks,
        unlocked_achievements: unlockedAchievements,
      };
    } catch (error) {
      console.error("Error adding points:", error);
      return {
        leveled_up: false,
        new_level: 1,
        unlocked_perks: [],
        unlocked_achievements: [],
      };
    }
  }

  /**
   * Update user stats based on activity
   */
  private async updateUserStats(
    userId: string,
    activityType: string,
  ): Promise<void> {
    const updates: Record<string, any> = {};

    switch (activityType) {
      case "listing_posted":
        updates.listings_posted = (this.supabase as any).raw(
          "listings_posted + 1",
        );
        break;
      case "item_sold":
        updates.items_sold = (this.supabase as any).raw("items_sold + 1");
        break;
      case "item_purchased":
        updates.items_purchased = (this.supabase as any).raw(
          "items_purchased + 1",
        );
        break;
      case "review_given":
        updates.reviews_given = (this.supabase as any).raw("reviews_given + 1");
        break;
      case "referral_made":
        updates.referrals_made = (this.supabase as any).raw(
          "referrals_made + 1",
        );
        break;
    }

    if (Object.keys(updates).length > 0) {
      await this.supabase
        .from("user_levels" as any)
        .update(updates)
        .eq("user_id", userId);
    }
  }

  /**
   * Award achievement badge to user
   */
  async awardBadge(
    userId: string,
    badgeType: string,
  ): Promise<Achievement | null> {
    try {
      // Get achievement details
      const { data: achievement, error: achievementError } = await this.supabase
        .from("achievements" as any)
        .select("*")
        .eq("badge_type", badgeType)
        .eq("is_active", true)
        .single();

      if (achievementError || !achievement) {
        console.error("Achievement not found:", badgeType);
        return null;
      }

      // Award achievement to user
      const { error: awardError } = await this.supabase
        .from("user_achievements" as any)
        .insert({
          user_id: userId,
          achievement_id: (achievement as any).id,
        });

      if (awardError) {
        // Ignore duplicate errors (user already has this achievement)
        if (!awardError.message.includes("duplicate")) {
          console.error("Failed to award badge:", awardError);
        }
        return null;
      }

      return achievement as unknown as Achievement;
    } catch (error) {
      console.error("Error awarding badge:", error);
      return null;
    }
  }

  /**
   * Check and award milestone achievements
   */
  async checkMilestoneAchievements(userId: string): Promise<Achievement[]> {
    const userLevel = await this.getUserLevel(userId);
    if (!userLevel) return [];

    const awarded: Achievement[] = [];

    // Check listing milestones
    if (userLevel.listings_posted === 1) {
      const badge = await this.awardBadge(userId, "first_listing");
      if (badge) awarded.push(badge);
    }

    // Check sale milestones
    if (userLevel.items_sold === 1) {
      const badge = await this.awardBadge(userId, "first_sale");
      if (badge) awarded.push(badge);
    } else if (userLevel.items_sold === 10) {
      const badge = await this.awardBadge(userId, "10_sales");
      if (badge) awarded.push(badge);
    } else if (userLevel.items_sold === 50) {
      const badge = await this.awardBadge(userId, "50_sales");
      if (badge) awarded.push(badge);
    } else if (userLevel.items_sold === 100) {
      const badge = await this.awardBadge(userId, "100_sales");
      if (badge) awarded.push(badge);
    }

    // Check review milestones
    if (userLevel.reviews_given === 1) {
      const badge = await this.awardBadge(userId, "first_review");
      if (badge) awarded.push(badge);
    } else if (userLevel.reviews_given === 10) {
      const badge = await this.awardBadge(userId, "10_reviews");
      if (badge) awarded.push(badge);
    }

    // Check referral milestones
    if (userLevel.referrals_made === 1) {
      const badge = await this.awardBadge(userId, "first_referral");
      if (badge) awarded.push(badge);
    } else if (userLevel.referrals_made === 10) {
      const badge = await this.awardBadge(userId, "10_referrals");
      if (badge) awarded.push(badge);
    }

    // Check streak milestones
    if (userLevel.current_streak_days === 7) {
      const badge = await this.awardBadge(userId, "streak_7");
      if (badge) awarded.push(badge);
    } else if (userLevel.current_streak_days === 30) {
      const badge = await this.awardBadge(userId, "streak_30");
      if (badge) awarded.push(badge);
    } else if (userLevel.current_streak_days === 100) {
      const badge = await this.awardBadge(userId, "streak_100");
      if (badge) awarded.push(badge);
    }

    return awarded;
  }

  /**
   * Check level-based achievements
   */
  private async checkLevelAchievements(
    userId: string,
    level: number,
  ): Promise<Achievement[]> {
    const awarded: Achievement[] = [];

    // Check if there's a level achievement for this level
    const levelBadges = ["level_5", "level_10", "level_25", "level_50"];
    const badgeType = `level_${level}`;

    if (levelBadges.includes(badgeType)) {
      const badge = await this.awardBadge(userId, badgeType);
      if (badge) awarded.push(badge);
    }

    return awarded;
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await this.supabase
      .from("user_achievements" as any)
      .select(
        `
        *,
        achievement:achievements(*)
      `,
      )
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    if (error) {
      console.error("Failed to get user achievements:", error);
      return [];
    }

    return (data || []) as unknown as UserAchievement[];
  }

  /**
   * Get all available achievements
   */
  async getAllAchievements(): Promise<Achievement[]> {
    const { data, error } = await this.supabase
      .from("achievements" as any)
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (error) {
      console.error("Failed to get achievements:", error);
      return [];
    }

    return (data || []) as unknown as Achievement[];
  }

  /**
   * Update displayed badges
   */
  async updateDisplayedBadges(
    userId: string,
    achievementIds: string[],
  ): Promise<boolean> {
    try {
      // First, set all badges to not displayed
      await this.supabase
        .from("user_achievements" as any)
        .update({ is_displayed: false })
        .eq("user_id", userId);

      // Then, set selected badges to displayed
      if (achievementIds.length > 0) {
        await this.supabase
          .from("user_achievements" as any)
          .update({ is_displayed: true })
          .eq("user_id", userId)
          .in("achievement_id", achievementIds);
      }

      return true;
    } catch (error) {
      console.error("Failed to update displayed badges:", error);
      return false;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    type: "sellers" | "buyers" | "points" = "points",
    limit: number = 50,
  ): Promise<LeaderboardEntry[]> {
    try {
      let orderBy: string;
      switch (type) {
        case "sellers":
          orderBy = "items_sold";
          break;
        case "buyers":
          orderBy = "items_purchased";
          break;
        default:
          orderBy = "total_points";
      }

      const { data, error } = await this.supabase
        .from("user_levels" as any)
        .select(
          `
          user_id,
          level,
          total_points,
          items_sold,
          items_purchased,
          users!inner(username, avatar_url)
        `,
        )
        .order(orderBy, { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Failed to get leaderboard:", error);
        return [];
      }

      return (data || []).map((entry: any, index: number) => ({
        user_id: entry.user_id,
        username: entry.users.username,
        avatar_url: entry.users.avatar_url,
        level: entry.level,
        total_points: entry.total_points,
        items_sold: entry.items_sold,
        items_purchased: entry.items_purchased,
        rank: index + 1,
      }));
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      return [];
    }
  }

  /**
   * Get points history
   */
  async getPointsHistory(userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await this.supabase
      .from("points_history" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to get points history:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Unlock perk for user
   */
  async unlockPerk(userId: string, perk: string): Promise<boolean> {
    try {
      const userLevel = await this.getUserLevel(userId);
      if (!userLevel) return false;

      const unlockedPerks = userLevel.unlocked_perks || [];
      if (unlockedPerks.includes(perk)) {
        return true; // Already unlocked
      }

      unlockedPerks.push(perk);

      // Update perks and add free boosts if applicable
      const updates: any = {
        unlocked_perks: unlockedPerks,
      };

      if (perk === "free_boost_monthly") {
        updates.free_boosts_remaining =
          (userLevel.free_boosts_remaining || 0) + 1;
      } else if (perk === "free_boost_weekly") {
        updates.free_boosts_remaining =
          (userLevel.free_boosts_remaining || 0) + 4;
      }

      const { error } = await this.supabase
        .from("user_levels" as any)
        .update(updates)
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to unlock perk:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error unlocking perk:", error);
      return false;
    }
  }

  /**
   * Use a free boost
   */
  async useFreeBoost(userId: string): Promise<boolean> {
    try {
      const userLevel = await this.getUserLevel(userId);
      if (!userLevel || userLevel.free_boosts_remaining <= 0) {
        return false;
      }

      const { error } = await this.supabase
        .from("user_levels" as any)
        .update({
          free_boosts_remaining: userLevel.free_boosts_remaining - 1,
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to use free boost:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error using free boost:", error);
      return false;
    }
  }

  /**
   * Get activity points value
   */
  getActivityPoints(activityType: string): number {
    const activityMap: Record<string, keyof typeof this.POINTS> = {
      listing_posted: "LISTING_POSTED",
      item_sold: "ITEM_SOLD",
      item_purchased: "ITEM_PURCHASED",
      review_given: "REVIEW_GIVEN",
      referral_made: "REFERRAL_MADE",
      daily_login: "DAILY_LOGIN",
      challenge_completed: "CHALLENGE_COMPLETED",
    };

    const key = activityMap[activityType];
    return key ? this.POINTS[key] : 0;
  }
}

export const gamificationService = new GamificationService();
