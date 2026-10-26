import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { socialShareService } from "@/lib/services/social-share";

/**
 * POST /api/social/share
 * Create a share link with tracking
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

    // Verify listing exists
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, price, user_id")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Generate share link
    const shareUrl = await socialShareService.generateShareLink({
      listingId,
      userId: user.id,
      platform,
      referralCode,
    });

    // Generate share text
    const shareText = socialShareService.generateShareText({
      title: listing.title,
      price: listing.price ?? 0,
    });

    // Get platform-specific URL
    const platformUrl = socialShareService.getPlatformShareUrl(
      platform,
      shareUrl,
      shareText,
    );

    return NextResponse.json({
      shareUrl,
      platformUrl,
      shareText,
    });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 },
    );
  }
}
