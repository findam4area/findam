import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gamificationService } from "@/lib/services/gamification";

/**
 * GET /api/achievements
 * Return user achievements and progress
 * Simplified endpoint for gamification
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    // If userId is provided, get that user's achievements (public view)
    if (userId) {
      const achievements =
        await gamificationService.getUserAchievements(userId);
      const userLevel = await gamificationService.getUserLevel(userId);

      // Filter to only show displayed achievements for public view
      const displayedAchievements = achievements.filter((a) => a.is_displayed);

      return NextResponse.json({
        success: true,
        userId,
        achievements: displayedAchievements,
        level: userLevel?.level || 1,
        total_points: userLevel?.total_points || 0,
      });
    }

    // Otherwise, get authenticated user's achievements
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please provide userId or authenticate." },
        { status: 401 },
      );
    }

    // Get user's achievements and level
    const [achievements, userLevel, allAchievements] = await Promise.all([
      gamificationService.getUserAchievements(user.id),
      gamificationService.getUserLevel(user.id),
      gamificationService.getAllAchievements(),
    ]);

    // Calculate progress
    const earnedCount = achievements.length;
    const totalCount = allAchievements.length;
    const progressPercentage =
      totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

    // Group achievements by category
    const achievementsByCategory = achievements.reduce(
      (acc, achievement) => {
        const category = achievement.achievement?.category || "other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(achievement);
        return acc;
      },
      {} as Record<string, typeof achievements>,
    );

    // Get next achievements to unlock
    const earnedBadgeTypes = new Set(
      achievements.map((a) => a.achievement?.badge_type).filter(Boolean),
    );
    const nextAchievements = allAchievements
      .filter((a) => !earnedBadgeTypes.has(a.badge_type))
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      userId: user.id,
      progress: {
        earned: earnedCount,
        total: totalCount,
        percentage: Math.round(progressPercentage),
      },
      level: {
        current: userLevel?.level || 1,
        current_points: userLevel?.current_points || 0,
        points_to_next_level: userLevel?.points_to_next_level || 100,
        total_points: userLevel?.total_points || 0,
      },
      achievements: {
        all: achievements,
        by_category: achievementsByCategory,
        displayed: achievements.filter((a) => a.is_displayed),
      },
      next_achievements: nextAchievements,
      stats: {
        listings_posted: userLevel?.listings_posted || 0,
        items_sold: userLevel?.items_sold || 0,
        items_purchased: userLevel?.items_purchased || 0,
        reviews_given: userLevel?.reviews_given || 0,
        referrals_made: userLevel?.referrals_made || 0,
        current_streak_days: userLevel?.current_streak_days || 0,
        longest_streak_days: userLevel?.longest_streak_days || 0,
      },
    });
  } catch (error) {
    console.error("Get achievements error:", error);
    return NextResponse.json(
      { error: "Failed to get achievements" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/achievements
 * Award an achievement to the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { badgeType } = body;

    if (!badgeType) {
      return NextResponse.json(
        { error: "Missing required field: badgeType" },
        { status: 400 },
      );
    }

    // Award the badge
    const achievement = await gamificationService.awardBadge(
      user.id,
      badgeType,
    );

    if (!achievement) {
      return NextResponse.json(
        {
          error:
            "Failed to award badge. Badge may not exist or already awarded.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      achievement,
      message: `Achievement "${achievement.name}" unlocked!`,
    });
  } catch (error) {
    console.error("Award achievement error:", error);
    return NextResponse.json(
      { error: "Failed to award achievement" },
      { status: 500 },
    );
  }
}
