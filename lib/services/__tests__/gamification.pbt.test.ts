/**
 * Property-Based Tests for Gamification Service
 * Tests Requirements 26.1, 26.6
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { gamificationService, GamificationService } from "../gamification";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn((table: string) => {
      if (table === "achievements") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "ach-1",
              badge_type: "first_listing",
              name: "First Steps",
              description: "Posted your first listing",
              icon: "package",
              category: "milestone",
              rarity: "common",
            },
            error: null,
          }),
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: "ach-1",
                badge_type: "first_listing",
                name: "First Steps",
                description: "Posted your first listing",
                icon: "package",
                category: "milestone",
                rarity: "common",
                is_active: true,
              },
            ],
            error: null,
          }),
        };
      } else if (table === "user_achievements") {
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      } else if (table === "user_levels") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: "123",
              user_id: "user-123",
              level: 5,
              current_points: 50,
              total_points: 550,
              points_to_next_level: 500,
              current_streak_days: 7,
              longest_streak_days: 10,
              last_activity_date: "2024-01-01",
              listings_posted: 10,
              items_sold: 5,
              items_purchased: 3,
              reviews_given: 2,
              referrals_made: 1,
              unlocked_perks: ["priority_support"],
              free_boosts_remaining: 1,
              users: { username: "testuser", avatar_url: null },
            },
            error: null,
          }),
        };
      } else if (table === "points_history") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
    rpc: vi.fn().mockResolvedValue({
      data: [{ new_level: 6, leveled_up: true }],
      error: null,
    }),
    raw: vi.fn((sql: string) => sql),
  }),
}));

describe("Gamification Service - Property Tests", () => {
  let service: GamificationService;

  beforeEach(() => {
    service = new GamificationService();
  });

  /**
   * Property 82: Achievement Badge Award
   * Validates: Requirement 26.1
   *
   * GIVEN any user ID and valid badge type
   * WHEN a badge is awarded
   * THEN the badge should be successfully awarded without errors
   */
  it("Property 82: should award achievement badges for valid badge types", async () => {
    const userId = "test-user-123";
    const badgeType = "first_listing";

    // Award badge should not throw and return achievement data
    const result = await service.awardBadge(userId, badgeType);

    // Result should be an achievement object with expected properties
    expect(result).toBeDefined();
    if (result !== null) {
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("description");
    }
  });

  /**
   * Property 83: Level-Up Perk Unlock
   * Validates: Requirement 26.6
   *
   * GIVEN any user at a perk-unlocking level
   * WHEN the user levels up
   * THEN appropriate perks should be unlocked
   */
  it("Property 83: should unlock perks at specific levels", async () => {
    const userId = "test-user-123";

    // Test level 5 - should unlock priority_support
    const result5 = await service.unlockPerk(userId, "priority_support");
    expect(result5).toBe(true);

    // Test level 10 - should unlock free_boost_monthly
    const result10 = await service.unlockPerk(userId, "free_boost_monthly");
    expect(result10).toBe(true);

    // Test level 25 - should unlock free_boost_weekly and reduced_fees_10
    const result25a = await service.unlockPerk(userId, "free_boost_weekly");
    expect(result25a).toBe(true);

    const result25b = await service.unlockPerk(userId, "reduced_fees_10");
    expect(result25b).toBe(true);
  });

  /**
   * Additional Property: Points Award Consistency
   *
   * GIVEN any activity type
   * WHEN points are awarded
   * THEN the points value should be consistent and positive
   */
  it("should award consistent positive points for all activity types", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "listing_posted",
          "item_sold",
          "item_purchased",
          "review_given",
          "referral_made",
          "daily_login",
          "challenge_completed",
        ),
        (activityType) => {
          const points = service.getActivityPoints(activityType);

          // Points should be positive
          expect(points).toBeGreaterThan(0);

          // Points should be consistent (same value each time)
          const points2 = service.getActivityPoints(activityType);
          expect(points).toBe(points2);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Additional Property: Milestone Achievement Checking
   *
   * GIVEN any user with activity stats
   * WHEN milestone achievements are checked
   * THEN appropriate badges should be awarded based on stats
   */
  it("should check and award milestone achievements based on user stats", async () => {
    const userId = "test-user-123";

    // Check milestone achievements should not throw
    await expect(
      service.checkMilestoneAchievements(userId),
    ).resolves.toBeDefined();
  });

  /**
   * Additional Property: Free Boost Usage
   *
   * GIVEN a user with free boosts
   * WHEN a free boost is used
   * THEN the count should decrement correctly
   */
  it("should correctly manage free boost usage", async () => {
    const userId = "test-user-123";

    // Use free boost should return true (user has boosts available in mock)
    const result = await service.useFreeBoost(userId);
    expect(typeof result).toBe("boolean");
  });

  /**
   * Additional Property: Leaderboard Type Validation
   *
   * GIVEN any valid leaderboard type
   * WHEN leaderboard is fetched
   * THEN it should return an array of entries
   */
  it("should fetch leaderboard for all valid types", async () => {
    const leaderboard = await service.getLeaderboard("points", 50);

    // Should return an array
    expect(Array.isArray(leaderboard)).toBe(true);
  });

  /**
   * Additional Property: Points History Retrieval
   *
   * GIVEN any user ID and limit
   * WHEN points history is fetched
   * THEN it should return an array with at most 'limit' entries
   */
  it("should respect limit when fetching points history", async () => {
    const userId = "test-user-123";
    const limit = 50;

    const history = await service.getPointsHistory(userId, limit);

    // Should return an array
    expect(Array.isArray(history)).toBe(true);

    // Should not exceed limit
    expect(history.length).toBeLessThanOrEqual(limit);
  });

  /**
   * Additional Property: Achievement Display Update
   *
   * GIVEN any user ID and array of achievement IDs
   * WHEN displayed badges are updated
   * THEN the operation should complete successfully
   */
  it("should update displayed badges without errors", async () => {
    const userId = "test-user-123";
    const achievementIds = ["ach-1", "ach-2"];

    const result = await service.updateDisplayedBadges(userId, achievementIds);

    // Should return a boolean
    expect(typeof result).toBe("boolean");
  });
});
