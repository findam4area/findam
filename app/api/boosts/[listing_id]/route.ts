/**
 * GET /api/boosts/[listing_id]
 * Get boost details and performance for a listing
 * Requirements: 14.8
 * Task: 34.9, 37.2
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { boostService } from "@/lib/services/boost";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listing_id: string }> },
) {
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

    const { listing_id } = await params;

    // Verify listing belongs to user
    const { data: listing, error: listingError } = await (supabase as any)
      .from("listings")
      .select("id, user_id")
      .eq("id", listing_id)
      .eq("user_id", user.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: "Listing not found or access denied" },
        { status: 404 },
      );
    }

    // Get active boosts for the listing
    const activeBoosts = await boostService.getActiveBoosts(listing_id);

    // Get performance data for each boost
    const boostsWithPerformance = await Promise.all(
      activeBoosts.map(async (boost) => {
        const performance = await boostService.getBoostPerformance(boost.id);
        return {
          ...boost,
          performance,
        };
      }),
    );

    return NextResponse.json({
      listing_id,
      active_boosts: boostsWithPerformance,
      is_boosted: boostsWithPerformance.length > 0,
    });
  } catch (error) {
    console.error("Error fetching boost details:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch boost details",
      },
      { status: 500 },
    );
  }
}
