import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VerificationService } from "@/lib/services/verification";

/**
 * Check badge criteria for a user
 * Requirements: 15.2, 15.4, 15.5
 * Tasks: 28.2
 *
 * GET /api/verification/badge/check?userId=xxx
 * Returns badge eligibility information
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    // Get current user if no userId provided
    let targetUserId = userId;
    if (!targetUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      targetUserId = user.id;
    }

    // Check badge criteria
    const result = await VerificationService.checkBadgeCriteria(targetUserId);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to check badge criteria" },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Badge check error:", error);
    return NextResponse.json(
      { error: "Failed to check badge criteria" },
      { status: 500 },
    );
  }
}
