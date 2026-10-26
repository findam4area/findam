/**
 * GET /api/referrals/leaderboard
 * Return referral leaderboard
 * Requirements: 17.10
 */

import { NextRequest, NextResponse } from "next/server";
import { referralService } from "@/lib/services/referral";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const month = searchParams.get("month") || undefined;

    // Get leaderboard
    const leaderboard = await referralService.getLeaderboard({
      limit,
      month,
    });

    return NextResponse.json(leaderboard, { status: 200 });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get leaderboard",
      },
      { status: 500 },
    );
  }
}
