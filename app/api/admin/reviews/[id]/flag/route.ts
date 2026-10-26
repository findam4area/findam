import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";

/**
 * POST /api/admin/reviews/[id]/flag
 * 
 * Flag a review for moderation
 * 
 * Requires: Admin authentication
 * 
 * @body FlagReviewRequest
 * {
 *   reason: string - Reason for flagging the review
 * }
 * 
 * @returns Flagged review with updated fields
 * 
 * Features:
 * - Sets is_flagged = true on the review
 * - Stores the reason and timestamp
 * - Trigger automatically recalculates business rating excluding flagged reviews
 * - Returns the updated review
 * 
 * Requirements: 11.7
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    // Check admin authentication
    const authCheck = await checkAdminAuth(supabase);
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 },
      );
    }

    const { id: reviewId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reviewId)) {
      return NextResponse.json(
        { error: "Invalid review ID format" },
        { status: 400 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { reason } = body;

    // Validate reason field
    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Reason is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    // Check if review exists
    const { data: existingReview, error: fetchError } = await supabase
      .from("business_reviews")
      .select("*")
      .eq("id", reviewId)
      .single();

    if (fetchError || !existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 },
      );
    }

    // Check if review is already flagged
    if (existingReview.is_flagged) {
      return NextResponse.json(
        { error: "Review is already flagged" },
        { status: 400 },
      );
    }

    // Flag the review
    const { data: flaggedReview, error: updateError } = await supabase
      .from("business_reviews")
      .update({
        is_flagged: true,
        flagged_reason: reason.trim(),
        flagged_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (updateError) {
      console.error("Error flagging review:", updateError);
      return NextResponse.json(
        { error: "Failed to flag review" },
        { status: 500 },
      );
    }

    // The database trigger will automatically recalculate the business rating
    // excluding flagged reviews (see update_business_rating_aggregates function)

    return NextResponse.json(
      {
        success: true,
        review: flaggedReview,
        message: "Review flagged successfully. Business rating has been recalculated.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in flag review endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
