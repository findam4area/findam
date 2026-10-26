import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gamificationService } from "@/lib/services/gamification";

/**
 * GET /api/gamification/achievements
 * Get user achievements or all available achievements
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const all = searchParams.get("all") === "true";

    if (all) {
      // Get all available achievements (public)
      const achievements = await gamificationService.getAllAchievements();
      return NextResponse.json(achievements);
    }

    // Get user achievements (requires auth)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const achievements = await gamificationService.getUserAchievements(user.id);
    return NextResponse.json(achievements);
  } catch (error) {
    console.error("Get achievements error:", error);
    return NextResponse.json(
      { error: "Failed to get achievements" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/gamification/achievements
 * Update displayed badges
 */
export async function PUT(request: NextRequest) {
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
    const { achievementIds } = body;

    if (!Array.isArray(achievementIds)) {
      return NextResponse.json(
        { error: "achievementIds must be an array" },
        { status: 400 },
      );
    }

    const success = await gamificationService.updateDisplayedBadges(
      user.id,
      achievementIds,
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update displayed badges" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update badges error:", error);
    return NextResponse.json(
      { error: "Failed to update badges" },
      { status: 500 },
    );
  }
}
