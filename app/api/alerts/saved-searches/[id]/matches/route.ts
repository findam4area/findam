/**
 * Saved Search Matches API
 * GET /api/alerts/saved-searches/[id]/matches - Get new matching listings
 * Requirements: 13.10
 */

import { NextRequest, NextResponse } from "next/server";
import { AlertService } from "@/lib/services/alert";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/alerts/saved-searches/[id]/matches
 * Get new matching listings for a saved search
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: search, error: searchError } = await supabase
      .from("saved_searches" as any)
      .select("user_id")
      .eq("id", id)
      .single();

    if (searchError || !search) {
      return NextResponse.json(
        { error: "Saved search not found" },
        { status: 404 },
      );
    }

    if ((search as any).user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for new matches
    const { newMatches, priceDrops } = await AlertService.checkForMatches(id);

    // Reset the match count since user is viewing matches
    await AlertService.resetMatchCount(id);

    return NextResponse.json({
      newMatches,
      priceDrops,
      totalCount: newMatches.length + priceDrops.length,
    });
  } catch (error: any) {
    console.error("Error fetching saved search matches:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch matches" },
      { status: 500 },
    );
  }
}
