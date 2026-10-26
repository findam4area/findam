import { NextRequest, NextResponse } from "next/server";
import { gamificationService } from "@/lib/services/gamification";

/**
 * GET /api/gamification/leaderboard
 * Get leaderboard data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get("type") || "points") as
      | "sellers"
      | "buyers"
      | "points";
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!["sellers", "buyers", "points"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be: sellers, buyers, or points" },
        { status: 400 },
      );
    }

    const leaderboard = await gamificationService.getLeaderboard(type, limit);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to get leaderboard" },
      { status: 500 },
    );
  }
}
