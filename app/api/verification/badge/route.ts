import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VerificationService } from "@/lib/services/verification";

/**
 * Get badge for a user
 * Requirements: 15.1
 * Tasks: 28.2
 *
 * GET /api/verification/badge?userId=xxx
 * Returns the user's verification badge
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    // Get badge
    const badge = await VerificationService.getBadge(userId);

    if (!badge) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }

    return NextResponse.json(badge);
  } catch (error) {
    console.error("Get badge error:", error);
    return NextResponse.json({ error: "Failed to get badge" }, { status: 500 });
  }
}
