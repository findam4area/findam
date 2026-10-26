/**
 * GET /api/boosts/analytics
 * Get user's boost analytics
 * Requirements: 14.8
 * Task: 34.9
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { boostService } from "@/lib/services/boost";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's boost analytics
    const analytics = await boostService.getUserBoostAnalytics(user.id);

    // Get user's recent boosts
    const recentBoosts = await boostService.getUserBoosts({
      user_id: user.id,
      limit: 10,
    });

    return NextResponse.json({
      analytics,
      recent_boosts: recentBoosts,
    });
  } catch (error) {
    console.error("Error fetching boost analytics:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch boost analytics",
      },
      { status: 500 },
    );
  }
}
