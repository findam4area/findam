/**
 * Business Review Response API Route
 * Task 8.3: Create POST /api/reviews/[id]/respond endpoint for business profile reviews
 * Requirements: 11.6
 * 
 * Endpoint: POST /api/business-reviews/[id]/respond
 * This endpoint allows business owners to respond to reviews left on their business profiles.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { businessOwnerResponseSchema } from "@/lib/validations/review";

/**
 * POST /api/business-reviews/[id]/respond
 * Business owner responds to a business profile review
 * 
 * Requirements:
 * 11.6 - Allow business owners to respond to reviews with a single response per review
 * 
 * Request body:
 * - response: string (max 1000 characters)
 * 
 * Validations:
 * - User must be authenticated
 * - User must own the business that was reviewed
 * - Review must exist and not already have a response
 * - Response text must be 1-1000 characters
 * 
 * Returns:
 * - Updated review with owner_response and responded_at fields
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reviewId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to respond to reviews." },
        { status: 401 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = businessOwnerResponseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    const { response } = validationResult.data;

    // Fetch the review with business profile information
    const { data: review, error: reviewError } = await supabase
      .from("business_reviews")
      .select(
        `
        *,
        business_profile:business_profiles!business_profile_id (
          id,
          user_id,
          business_name
        )
      `,
      )
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      console.error("Review fetch error:", reviewError);
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 },
      );
    }

    // Verify the user owns the business that was reviewed (Requirement 11.6)
    const businessProfile = review.business_profile as any;
    if (!businessProfile || businessProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Only the business owner can respond to this review" },
        { status: 403 },
      );
    }

    // Check if review already has a response (single response per review - Requirement 11.6)
    if (review.owner_response) {
      return NextResponse.json(
        {
          error: "This review already has a response. Only one response per review is allowed.",
          existing_response: {
            owner_response: review.owner_response,
            responded_at: review.responded_at,
          },
        },
        { status: 409 },
      );
    }

    // Update the review with owner response
    const { data: updatedReview, error: updateError } = await supabase
      .from("business_reviews")
      .update({
        owner_response: response,
        responded_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select(
        `
        *,
        reviewer:reviewer_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        business_profile:business_profiles!business_profile_id (
          id,
          business_name
        )
      `,
      )
      .single();

    if (updateError) {
      console.error("Review update error:", updateError);
      return NextResponse.json(
        { error: "Failed to add response to review" },
        { status: 500 },
      );
    }

    // Optionally, create a notification for the reviewer
    try {
      await supabase.from("notifications").insert({
        user_id: review.reviewer_id,
        type: "business_owner_response",
        title: "Business Owner Responded",
        message: `${businessProfile.business_name} has responded to your review`,
        link: `/business/${businessProfile.id}`,
      });
    } catch (notificationError) {
      // Don't fail the request if notification creation fails
      console.error("Notification creation error:", notificationError);
    }

    return NextResponse.json(
      {
        review: updatedReview,
        message: "Response added successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Business review response error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
