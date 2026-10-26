import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gamificationService } from "@/lib/services/gamification";

/**
 * POST /api/gamification/points
 * Add points to user
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
    const { points, activityType, description, referenceId } = body;

    if (!points || !activityType) {
      return NextResponse.json(
        { error: "Missing required fields: points, activityType" },
        { status: 400 },
      );
    }

    const result = await gamificationService.addPoints(
      user.id,
      points,
      activityType,
      description,
      referenceId,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Add points error:", error);
    return NextResponse.json(
      { error: "Failed to add points" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/gamification/points
 * Get points history
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");

    const history = await gamificationService.getPointsHistory(user.id, limit);

    return NextResponse.json(history);
  } catch (error) {
    console.error("Get points history error:", error);
    return NextResponse.json(
      { error: "Failed to get points history" },
      { status: 500 },
    );
  }
}
