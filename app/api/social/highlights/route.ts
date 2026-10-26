import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { socialShareService } from "@/lib/services/social-share";

/**
 * GET /api/social/highlights
 * Get weekly highlights for the authenticated user
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

    const highlights = await socialShareService.getWeeklyHighlights(user.id);

    if (!highlights) {
      return NextResponse.json(
        { message: "No highlights available for this week" },
        { status: 200 },
      );
    }

    return NextResponse.json(highlights);
  } catch (error) {
    console.error("Get highlights error:", error);
    return NextResponse.json(
      { error: "Failed to get weekly highlights" },
      { status: 500 },
    );
  }
}
