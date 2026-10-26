/**
 * POST /api/referrals/track
 * Track referral signup and credit rewards
 * Requirements: 17.1, 17.2, 17.3, 17.4
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { referralService } from "@/lib/services/referral";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { referral_code } = body;

    if (!referral_code) {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 },
      );
    }

    // Track referral signup
    const referral = await referralService.trackReferralSignup({
      referral_code,
      referred_user_id: user.id,
    });

    // Validate referred user (basic validation)
    await referralService.validateReferredUser({
      referral_id: referral.id,
    });

    // Credit signup rewards
    await referralService.creditSignupRewards(referral.id);

    return NextResponse.json(
      {
        success: true,
        message: "Referral tracked and rewards credited",
        referral,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Track referral error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to track referral",
      },
      { status: 500 },
    );
  }
}
