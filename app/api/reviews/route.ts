import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createReviewSchema } from "@/lib/validations/review";

/**
 * POST /api/reviews - Create a new review
 * Requirements: 25.2, 25.3, 25.10
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createReviewSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const input = validationResult.data;

    // Requirement 25.3: Verify purchase before publishing review
    let isVerifiedPurchase = false;
    
    if (input.listing_id) {
      // Check purchase_records table for completed purchases
      const { data: purchaseRecord } = await supabase
        .from("purchase_records")
        .select("id")
        .eq("buyer_id", user.id)
        .eq("listing_id", input.listing_id)
        .in("delivery_status", ["delivered", "processing", "shipped", "in_transit"])
        .maybeSingle();

      if (purchaseRecord) {
        isVerifiedPurchase = true;
      } else {
        // Also check escrow_transactions for released payments
        const { data: escrowTransaction } = await supabase
          .from("escrow_transactions")
          .select("id")
          .eq("buyer_id", user.id)
          .eq("listing_id", input.listing_id)
          .eq("status", "released")
          .maybeSingle();

        if (escrowTransaction) {
          isVerifiedPurchase = true;
        }
      }
    }

    // Requirement 25.10: Prevent duplicate reviews for same listing by same user
    if (input.listing_id) {
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("reviewer_id", user.id)
        .eq("listing_id", input.listing_id)
        .maybeSingle();

      if (existingReview) {
        return NextResponse.json(
          { error: "You have already reviewed this listing" },
          { status: 409 },
        );
      }
    }

    // Create the review with all fields
    const { data: review, error: createError } = await supabase
      .from("reviews")
      .insert({
        reviewer_id: user.id,
        reviewed_user_id: input.reviewed_user_id,
        listing_id: input.listing_id,
        vendor_id: input.vendor_id,
        rating: input.rating,
        comment: input.comment,
        images: input.images || [],
        is_verified_purchase: isVerifiedPurchase,
      })
      .select(
        `
        *,
        reviewer:users!reviewer_id(id, username, avatar_url)
      `,
      )
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Update the reviewed user's trust score
    await updateUserTrustScore(supabase, input.reviewed_user_id);

    // Create notification for the reviewed user
    await supabase.from("notifications").insert({
      user_id: input.reviewed_user_id,
      type: "review_received",
      title: "New Review",
      message: `You received a ${input.rating}-star review${isVerifiedPurchase ? " from a verified purchase" : ""}`,
      link: `/profile/${input.reviewed_user_id}`,
    });

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/reviews?listing_id=xxx&sort=helpfulness|recency|rating - Get reviews for a listing
 * Requirements: 25.1, 25.4, 25.6, 25.9
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listing_id");
    const vendorId = searchParams.get("vendor_id");
    const sortBy = searchParams.get("sort") || "recency"; // helpfulness, recency, rating

    if (!listingId && !vendorId) {
      return NextResponse.json(
        { error: "listing_id or vendor_id is required" },
        { status: 400 },
      );
    }

    // Build query
    let query = supabase
      .from("reviews")
      .select(
        `
        *,
        reviewer:users!reviewer_id(id, username, avatar_url, trust_score)
      `,
      );

    if (listingId) {
      query = query.eq("listing_id", listingId);
    }
    if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    }

    // Requirement 25.9: Sort reviews by helpfulness, recency, or rating
    switch (sortBy) {
      case "helpfulness":
        query = query.order("helpfulness_votes", { ascending: false });
        break;
      case "rating":
        query = query.order("rating", { ascending: false });
        break;
      case "recency":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const { data: reviews, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Requirement 25.1: Calculate average rating
    const average =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
        : 0;

    // Requirement 25.4: Calculate 5-star breakdown
    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return NextResponse.json({
      data: reviews,
      average: Number(average.toFixed(1)),
      count: reviews.length,
      ratingDistribution,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Helper function to update user's trust score
 */
async function updateUserTrustScore(
  supabase: any,
  userId: string,
): Promise<void> {
  // Get user data
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("phone_verified, nin_verified, video_verified")
    .eq("id", userId)
    .single();

  if (userError || !user) return;

  // Get average rating
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewed_user_id", userId);

  const count = reviews?.length || 0;
  const average =
    count > 0
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) /
        count
      : 0;

  // Calculate trust score
  let score = 0;

  // Base score from verifications
  if (user.phone_verified) score += 30;
  if (user.nin_verified) score += 40;
  if (user.video_verified) score += 30;

  // If all verifications complete, set to 100
  if (user.phone_verified && user.nin_verified && user.video_verified) {
    score = 100;
  } else if (count > 0) {
    // Add score from reviews (up to 30 points)
    const reviewScore = (average / 5) * 30;
    score = Math.min(score + reviewScore, 100);
  }

  // Update user's trust score
  await supabase
    .from("users")
    .update({
      trust_score: Math.round(score),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
