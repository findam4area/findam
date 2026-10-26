/**
 * Pin Product to Live Session API Route
 *
 * POST /api/live-sessions/:id/pin-product - Pin a product
 * DELETE /api/live-sessions/:id/pin-product - Unpin a product
 *
 * Requirements: 2.4
 * Task: 20.4
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { liveStreamService } from "@/lib/services/live-stream";

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * POST /api/live-sessions/:id/pin-product
 * Pin a product to live session
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { listing_id } = body;

    if (!listing_id) {
      return NextResponse.json(
        { error: "listing_id is required" },
        { status: 400 },
      );
    }

    // Verify listing exists and belongs to user
    const { data: listing } = await supabase
      .from("listings")
      .select("id, user_id, is_active")
      .eq("id", listing_id)
      .single();

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only pin your own listings" },
        { status: 403 },
      );
    }

    if (!listing.is_active) {
      return NextResponse.json(
        { error: "Only active listings can be pinned" },
        { status: 400 },
      );
    }

    // Pin product using service
    const pinnedProducts = await liveStreamService.pinProduct(
      sessionId,
      listing_id,
      user.id,
    );

    return NextResponse.json({ pinned_products: pinnedProducts });
  } catch (error) {
    console.error("Error pinning product:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to pin product",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/live-sessions/:id/pin-product
 * Unpin a product from live session
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { listing_id } = body;

    if (!listing_id) {
      return NextResponse.json(
        { error: "listing_id is required" },
        { status: 400 },
      );
    }

    // Unpin product using service
    const pinnedProducts = await liveStreamService.unpinProduct(
      sessionId,
      listing_id,
      user.id,
    );

    return NextResponse.json({ pinned_products: pinnedProducts });
  } catch (error) {
    console.error("Error unpinning product:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to unpin product",
      },
      { status: 500 },
    );
  }
}
