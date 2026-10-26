import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { socialShareService } from "@/lib/services/social-share";

/**
 * POST /api/share
 * Track share and return share URL
 * Simplified endpoint for social sharing
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { listingId, platform, referralCode } = body;

    if (!listingId || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: listingId, platform" },
        { status: 400 },
      );
    }

    // Validate platform
    const validPlatforms = ["whatsapp", "twitter", "facebook", "instagram"];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        {
          error: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Verify listing exists
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, price, condition, category_id")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Generate share link with tracking
    const shareUrl = await socialShareService.generateShareLink({
      listingId,
      userId: user.id,
      platform,
      referralCode,
    });

    // Generate share text with hashtags
    const shareText = socialShareService.generateShareText({
      title: listing.title,
      price: listing.price ?? 0,
      condition: listing.condition ?? undefined,
    });

    // Get platform-specific URL
    const platformUrl = socialShareService.getPlatformShareUrl(
      platform,
      shareUrl,
      shareText,
    );

    // Get share metrics for this listing
    const metrics = await socialShareService.getListingShareMetrics(listingId);

    return NextResponse.json({
      success: true,
      shareUrl,
      platformUrl,
      shareText,
      metrics: {
        total_shares: metrics.total_shares + 1, // Include this new share
        total_views: metrics.total_views,
        total_clicks: metrics.total_clicks,
        total_conversions: metrics.total_conversions,
      },
    });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/share
 * Get share metrics for a listing
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json(
        { error: "Missing required parameter: listingId" },
        { status: 400 },
      );
    }

    const metrics = await socialShareService.getListingShareMetrics(listingId);

    return NextResponse.json({
      success: true,
      listingId,
      metrics,
    });
  } catch (error) {
    console.error("Get share metrics error:", error);
    return NextResponse.json(
      { error: "Failed to get share metrics" },
      { status: 500 },
    );
  }
}
