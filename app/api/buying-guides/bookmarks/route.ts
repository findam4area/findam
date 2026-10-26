/**
 * User Bookmarked Guides API
 * GET /api/buying-guides/bookmarks - Get user's bookmarked guides
 * Requirements: 22.8
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BuyingGuideService } from "@/lib/services/buying-guide";

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

    const guides = await BuyingGuideService.getBookmarkedGuides(user.id);

    return NextResponse.json({ guides });
  } catch (error) {
    console.error("Error fetching bookmarked guides:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch bookmarked guides",
      },
      { status: 500 },
    );
  }
}
