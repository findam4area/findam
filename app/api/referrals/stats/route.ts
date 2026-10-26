/**
 * GET /api/referrals/stats
 * Return referral statistics and earnings
 * Requirements: 17.6
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { referralService } from "@/lib/services/referral";

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

    // Get referral stats
    const stats = await referralService.getReferralStats(user.id);

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error("Get referral stats error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get referral stats",
      },
      { status: 500 },
    );
  }
}
