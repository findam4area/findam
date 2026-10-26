/**
 * POST /api/referrals/generate-code
 * Generate and return unique referral code
 * Requirements: 17.1
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

    // Get or generate referral code
    const code = await referralService.getUserReferralCode(user.id);

    return NextResponse.json({ code }, { status: 200 });
  } catch (error) {
    console.error("Generate referral code error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate referral code",
      },
      { status: 500 },
    );
  }
}
