import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateReviewSchema } from "@/lib/validations/review";

/**
 * PUT /api/reviews/[id] - Update a review
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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
    const validationResult = updateReviewSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const input = validationResult.data;

    // Verify ownership
    const { data: existingReview, error: fetchError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", id)
      .eq("reviewer_id", user.id)
      .single();

    if (fetchError || !existingReview) {
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 },
      );
    }

    // Update the review
    const { data: review, error: updateError } = await supabase
      .from("reviews")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        reviewer:users!reviewer_id(id, username, avatar_url)
      `,
      )
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update the reviewed user's trust score
    await updateUserTrustScore(supabase, existingReview.reviewed_user_id ?? "");

    return NextResponse.json({ data: review });
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/reviews/[id] - Delete a review
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: existingReview, error: fetchError } = await supabase
      .from("reviews")
      .select("reviewed_user_id")
      .eq("id", id)
      .eq("reviewer_id", user.id)
      .single();

    if (fetchError || !existingReview) {
      return NextResponse.json(
        { error: "Review not found or unauthorized" },
        { status: 404 },
      );
    }

    // Delete the review
    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Update the reviewed user's trust score
    await updateUserTrustScore(supabase, existingReview.reviewed_user_id ?? "");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
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
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / count
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
