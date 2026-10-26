/**
 * Video View Tracking API
 * Requirements: 1.8
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/video-listings/[id]/view
 * Track video view duration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Parse request body
    const body = await request.json();
    const { duration } = body;

    if (typeof duration !== "number" || duration < 0) {
      return NextResponse.json(
        { error: "Invalid duration value" },
        { status: 400 },
      );
    }

    // Get current user (optional - views can be tracked anonymously)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Increment view count using RPC function
    const { error: updateError } = await supabase.rpc("increment_video_views", {
      video_id: id,
    });

    if (updateError) {
      console.error("Error updating view count:", updateError);
      return NextResponse.json(
        { error: "Failed to update view count" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "View tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking video view:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
