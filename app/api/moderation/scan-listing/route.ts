/**
 * POST /api/moderation/scan-listing
 *
 * Trigger moderation scan for a listing.
 * Returns moderation result with confidence score and violations.
 *
 * Requirements: 6.1
 * Task: 10.1
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  contentModerationService,
  type ListingForModeration,
} from "@/lib/services/content-moderation";

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

    // Parse request body
    const body = await request.json();
    const { title, description, price, category, images, listingId } = body;

    // Validate required fields
    if (!title || !description || price === undefined || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create listing object for moderation
    const listing: ListingForModeration = {
      id: listingId,
      title,
      description,
      price,
      category,
      images: images || [],
      userId: user.id,
    };

    // Scan the listing
    const result = await contentModerationService.scanListing(listing);

    // Store the result in database
    await contentModerationService.storeModerationResult(
      result,
      user.id,
      listingId,
    );

    // Return moderation result
    return NextResponse.json({
      approved: result.approved,
      confidence: result.confidence,
      action: result.action,
      violations: result.violations,
      shouldBlock: contentModerationService.shouldBlockListing(result),
      reason:
        result.action === "reject"
          ? contentModerationService.getRejectionReason(result)
          : result.action === "flag"
            ? contentModerationService.getFlaggingReason(result)
            : undefined,
    });
  } catch (error) {
    console.error("Error scanning listing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
