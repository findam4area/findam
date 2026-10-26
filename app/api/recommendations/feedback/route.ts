/**
 * Recommendation Feedback API Route
 * Requirements: 7.8
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { listingId, feedback } = body;

    // Validate input
    if (!listingId || !["up", "down"].includes(feedback)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Store feedback in recommendation_feedback table
    const { error: insertError } = await supabase
      .from("recommendation_feedback")
      .insert({
        user_id: user.id,
        listing_id: listingId,
        feedback_type: feedback,
      });

    if (insertError) {
      console.error("Error storing feedback:", insertError);
      return NextResponse.json(
        { error: "Failed to store feedback" },
        { status: 500 },
      );
    }

    // Update user behavior to adjust recommendation weights
    // Positive feedback increases category preference
    // Negative feedback decreases category preference
    if (feedback === "up") {
      // Get listing category
      const { data: listing } = await supabase
        .from("listings")
        .select("category_id")
        .eq("id", listingId)
        .single();

      if (listing?.category_id) {
        await supabase.rpc("update_category_preference", {
          p_user_id: user.id,
          p_category_id: listing.category_id,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing feedback:", error);
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 },
    );
  }
}
