import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { socialShareService } from "@/lib/services/social-share";

/**
 * GET /api/social/share/[id]/metrics
 * Get share metrics for a listing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: listingId } = await params;

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 },
      );
    }

    const metrics = await socialShareService.getListingShareMetrics(listingId);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Get metrics error:", error);
    return NextResponse.json(
      { error: "Failed to get share metrics" },
      { status: 500 },
    );
  }
}
