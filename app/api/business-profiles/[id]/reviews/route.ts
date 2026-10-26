/**
 * Business Reviews API Route
 * Task 8.1: Create POST /api/business-profiles/[id]/reviews endpoint
 * Task 8.2: Create GET /api/business-profiles/[id]/reviews endpoint
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.5
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/business-profiles/[id]/reviews
 * Submit a review for a business profile
 * 
 * Requirements:
 * 11.1 - Accept rating (1-5 stars) and comment (10-1000 characters)
 * 11.2 - Validate comment length
 * 11.3 - Prevent duplicate reviews (one per user per business)
 * 11.4 - Update aggregate rating via trigger
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: businessProfileId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to submit a review." },
        { status: 401 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { rating, comment } = body;

    // Validate rating (Requirement 11.1)
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5" },
        { status: 400 },
      );
    }

    // Validate comment (Requirement 11.2)
    if (typeof comment !== "string") {
      return NextResponse.json(
        { error: "Comment must be a string" },
        { status: 400 },
      );
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 10 || trimmedComment.length > 1000) {
      return NextResponse.json(
        { error: "Comment must be between 10 and 1000 characters" },
        { status: 400 },
      );
    }

    // Check if business profile exists
    const { data: businessProfile, error: businessError } = await supabase
      .from("business_profiles")
      .select("id, user_id, business_name")
      .eq("id", businessProfileId)
      .single();

    if (businessError || !businessProfile) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 },
      );
    }

    // Check user is not the business owner (Requirement 11.3 extension)
    if (businessProfile.user_id === user.id) {
      return NextResponse.json(
        { error: "Business owners cannot review their own business" },
        { status: 403 },
      );
    }

    // Check if user has already reviewed this business (Requirement 11.3)
    const { data: existingReview, error: checkError } = await supabase
      .from("business_reviews")
      .select("id")
      .eq("business_profile_id", businessProfileId)
      .eq("reviewer_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Review check error:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing reviews" },
        { status: 500 },
      );
    }

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this business" },
        { status: 409 },
      );
    }

    // Insert the review
    const { data: newReview, error: insertError } = await supabase
      .from("business_reviews")
      .insert({
        business_profile_id: businessProfileId,
        reviewer_id: user.id,
        rating,
        comment: trimmedComment,
      })
      .select(
        `
        *,
        reviewer:reviewer_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `,
      )
      .single();

    if (insertError) {
      console.error("Review insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to submit review" },
        { status: 500 },
      );
    }

    // Fetch updated business rating (Requirement 11.4)
    // The trigger will have updated these values automatically
    const { data: updatedBusiness, error: ratingError } = await supabase
      .from("business_profiles")
      .select("average_rating, review_count")
      .eq("id", businessProfileId)
      .single();

    if (ratingError) {
      console.error("Rating fetch error:", ratingError);
      // Don't fail the request if we can't fetch the updated rating
    }

    // Return the created review and updated business rating
    return NextResponse.json(
      {
        review: newReview,
        updated_business_rating: updatedBusiness
          ? {
              average_rating: updatedBusiness.average_rating,
              review_count: updatedBusiness.review_count,
            }
          : null,
        message: "Review submitted successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/business-profiles/[id]/reviews
 * Get paginated reviews for a business profile with rating breakdown
 * 
 * Requirements:
 * 11.5 - Display reviews in reverse chronological order
 * 12.5 - Calculate and return rating breakdown
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: businessProfileId } = await params;
    const supabase = await createClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sort_by = searchParams.get("sort_by") || "recent";

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json(
        { error: "Page must be greater than or equal to 1" },
        { status: 400 },
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 },
      );
    }

    // Validate sort_by parameter
    const validSortOptions = ["recent", "rating_high", "rating_low"];
    if (!validSortOptions.includes(sort_by)) {
      return NextResponse.json(
        { error: `sort_by must be one of: ${validSortOptions.join(", ")}` },
        { status: 400 },
      );
    }

    // Check if business profile exists
    const { data: businessProfile, error: businessError } = await supabase
      .from("business_profiles")
      .select("id, business_name")
      .eq("id", businessProfileId)
      .single();

    if (businessError || !businessProfile) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 },
      );
    }

    // Calculate pagination offset
    const offset = (page - 1) * limit;

    // Build base query for reviews
    let reviewsQuery = supabase
      .from("business_reviews")
      .select(
        `
        *,
        reviewer:reviewer_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `,
        { count: "exact" },
      )
      .eq("business_profile_id", businessProfileId)
      .eq("is_flagged", false); // Only show non-flagged reviews

    // Apply sorting (Requirement 11.5 - reverse chronological order by default)
    if (sort_by === "recent") {
      reviewsQuery = reviewsQuery.order("created_at", { ascending: false });
    } else if (sort_by === "rating_high") {
      reviewsQuery = reviewsQuery
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false });
    } else if (sort_by === "rating_low") {
      reviewsQuery = reviewsQuery
        .order("rating", { ascending: true })
        .order("created_at", { ascending: false });
    }

    // Apply pagination
    reviewsQuery = reviewsQuery.range(offset, offset + limit - 1);

    // Execute query
    const { data: reviews, error: reviewsError, count } = await reviewsQuery;

    if (reviewsError) {
      console.error("Reviews fetch error:", reviewsError);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 },
      );
    }

    // Calculate rating breakdown (Requirement 12.5)
    const { data: allReviews, error: allReviewsError } = await supabase
      .from("business_reviews")
      .select("rating")
      .eq("business_profile_id", businessProfileId)
      .eq("is_flagged", false);

    if (allReviewsError) {
      console.error("Rating breakdown fetch error:", allReviewsError);
      return NextResponse.json(
        { error: "Failed to calculate rating breakdown" },
        { status: 500 },
      );
    }

    // Calculate rating breakdown
    const rating_breakdown = {
      five_star: allReviews?.filter((r) => r.rating === 5).length || 0,
      four_star: allReviews?.filter((r) => r.rating === 4).length || 0,
      three_star: allReviews?.filter((r) => r.rating === 3).length || 0,
      two_star: allReviews?.filter((r) => r.rating === 2).length || 0,
      one_star: allReviews?.filter((r) => r.rating === 1).length || 0,
    };

    // Return paginated reviews with rating breakdown
    return NextResponse.json({
      reviews: reviews || [],
      total: count || 0,
      page,
      limit,
      rating_breakdown,
    });
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
