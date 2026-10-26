import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gamificationService } from "@/lib/services/gamification";

/**
 * GET /api/gamification/level
 * Get user level and stats
 */
export async function GET(_request: NextRequest) {
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

    const userLevel = await gamificationService.getUserLevel(user.id);

    if (!userLevel) {
      return NextResponse.json(
        { error: "User level not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(userLevel);
  } catch (error) {
    console.error("Get level error:", error);
    return NextResponse.json(
      { error: "Failed to get user level" },
      { status: 500 },
    );
  }
}
