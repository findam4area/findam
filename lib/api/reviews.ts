import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Review, User } from "@/lib/types";
import type {
  CreateReviewInput,
  UpdateReviewInput,
} from "@/lib/validations/review";

/**
 * Transform database review data to Review type
 * Handles partial user data from database joins
 */
function transformReviewData(review: any): Review {
  return {
    ...review,
    reviewer: review.reviewer ? {
      id: review.reviewer.id,
      username: review.reviewer.username,
      avatar_url: review.reviewer.avatar_url,
      trust_score: review.reviewer.trust_score || 0,
      // Add required User fields with defaults
      email: '',
      is_premium: false,
      phone_verified: false,
      nin_verified: false,
      video_verified: false,
      is_suspended: false,
      is_service_provider: false,
      is_job_seeker: false,
      created_at: '',
      updated_at: '',
      location: null,
      bio: null,
    } as User : undefined
  };
}

/**
 * Create a new review (client-side)
 * Validates that the reviewer has completed a transaction with the reviewed user
 */
export async function createReview(
  reviewerId: string,
  input: CreateReviewInput,
): Promise<{ data: Review | null; error: string | null }> {
  const supabase = createClient();

  // Check if reviewer has a conversation with the reviewed user (transaction authorization)
  const { data: conversations, error: convError } = await (supabase as any)
    .from("conversation_participants")
    .select(
      `
      conversation_id,
      conversations!inner(
        listing_id,
        listings!inner(user_id)
      )
    `,
    )
    .eq("user_id", reviewerId);

  if (convError) {
    return { data: null, error: "Failed to verify transaction authorization" };
  }

  // Check if reviewer has interacted with the reviewed user
  const hasInteracted = conversations?.some((conv: any) => {
    return conv.conversations?.listings?.user_id === input.reviewed_user_id;
  });

  if (!hasInteracted) {
    return {
      data: null,
      error: "You must complete a transaction before leaving a review",
    };
  }

  // Check for duplicate review
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", reviewerId)
    .eq("reviewed_user_id", input.reviewed_user_id)
    .eq("listing_id", input.listing_id ?? "")
    .maybeSingle();

  if (existingReview) {
    return {
      data: null,
      error: "You have already reviewed this user for this listing",
    };
  }

  // Create the review
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      reviewer_id: reviewerId,
      reviewed_user_id: input.reviewed_user_id,
      listing_id: input.listing_id,
      rating: input.rating,
      comment: input.comment,
    })
    .select(
      `
      *,
      reviewer:users!reviewer_id(id, username, avatar_url)
    `,
    )
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  // Update the reviewed user's trust score
  await updateUserTrustScore(input.reviewed_user_id);

  // Create notification for the reviewed user
  await supabase.from("notifications").insert({
    user_id: input.reviewed_user_id,
    type: "review_received",
    title: "New Review",
    message: `You received a ${input.rating}-star review`,
    link: `/profile/${input.reviewed_user_id}`,
  });

  return { data: transformReviewData(data), error: null };
}

/**
 * Get reviews for a user (client-side)
 */
export async function getUserReviews(
  userId: string,
): Promise<{ data: Review[]; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      *,
      reviewer:users!reviewer_id(id, username, avatar_url, trust_score)
    `,
    )
    .eq("reviewed_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data.map(transformReviewData), error: null };
}

/**
 * Get average rating for a user (client-side)
 */
export async function getUserAverageRating(
  userId: string,
): Promise<{ average: number; count: number; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewed_user_id", userId);

  if (error) {
    return { average: 0, count: 0, error: error.message };
  }

  if (!data || data.length === 0) {
    return { average: 0, count: 0, error: null };
  }

  const sum = data.reduce((acc, review) => acc + (review.rating ?? 0), 0);
  const average = sum / data.length;

  return { average, count: data.length, error: null };
}

/**
 * Update a review (client-side)
 */
export async function updateReview(
  reviewId: string,
  reviewerId: string,
  input: UpdateReviewInput,
): Promise<{ data: Review | null; error: string | null }> {
  const supabase = createClient();

  // Verify ownership
  const { data: existingReview, error: fetchError } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .eq("reviewer_id", reviewerId)
    .single();

  if (fetchError || !existingReview) {
    return { data: null, error: "Review not found or unauthorized" };
  }

  // Update the review
  const { data, error } = await supabase
    .from("reviews")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select(
      `
      *,
      reviewer:users!reviewer_id(id, username, avatar_url)
    `,
    )
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  // Update the reviewed user's trust score
  await updateUserTrustScore(existingReview.reviewed_user_id ?? "");

  return { data: transformReviewData(data), error: null };
}

/**
 * Delete a review (client-side)
 */
export async function deleteReview(
  reviewId: string,
  reviewerId: string,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  // Verify ownership
  const { data: existingReview, error: fetchError } = await supabase
    .from("reviews")
    .select("reviewed_user_id")
    .eq("id", reviewId)
    .eq("reviewer_id", reviewerId)
    .single();

  if (fetchError || !existingReview) {
    return { success: false, error: "Review not found or unauthorized" };
  }

  // Delete the review
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Update the reviewed user's trust score
  await updateUserTrustScore(existingReview.reviewed_user_id ?? "");

  return { success: true, error: null };
}

/**
 * Update user's trust score based on reviews
 */
async function updateUserTrustScore(userId: string): Promise<void> {
  const supabase = createClient();

  // Get user data
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("phone_verified, nin_verified, video_verified")
    .eq("id", userId)
    .single();

  if (userError || !user) return;

  // Get average rating
  const { average, count } = await getUserAverageRating(userId);

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

/**
 * Check if user can review another user (client-side)
 */
export async function canUserReview(
  reviewerId: string,
  reviewedUserId: string,
  listingId?: string,
): Promise<{ canReview: boolean; reason?: string }> {
  const supabase = createClient();

  // Check if already reviewed
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", reviewerId)
    .eq("reviewed_user_id", reviewedUserId)
    .eq("listing_id", listingId ?? "")
    .maybeSingle();

  if (existingReview) {
    return {
      canReview: false,
      reason: "You have already reviewed this user for this listing",
    };
  }

  // Check if reviewer has a conversation with the reviewed user
  const { data: conversations, error: convError } = await (supabase as any)
    .from("conversation_participants")
    .select(
      `
      conversation_id,
      conversations!inner(
        listing_id,
        listings!inner(user_id)
      )
    `,
    )
    .eq("user_id", reviewerId);

  if (convError) {
    return { canReview: false, reason: "Failed to verify authorization" };
  }

  // Check if reviewer has interacted with the reviewed user
  const hasInteracted = conversations?.some((conv: any) => {
    return conv.conversations?.listings?.user_id === reviewedUserId;
  });

  if (!hasInteracted) {
    return {
      canReview: false,
      reason: "You must complete a transaction before leaving a review",
    };
  }

  return { canReview: true };
}

/**
 * Server-side: Get reviews for a user
 */
export async function getServerUserReviews(
  userId: string,
): Promise<{ data: Review[]; error: string | null }> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      *,
      reviewer:users!reviewer_id(id, username, avatar_url, trust_score)
    `,
    )
    .eq("reviewed_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data.map(transformReviewData), error: null };
}

/**
 * Server-side: Get average rating for a user
 */
export async function getServerUserAverageRating(
  userId: string,
): Promise<{ average: number; count: number; error: string | null }> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewed_user_id", userId);

  if (error) {
    return { average: 0, count: 0, error: error.message };
  }

  if (!data || data.length === 0) {
    return { average: 0, count: 0, error: null };
  }

  const sum = data.reduce((acc, review) => acc + (review.rating ?? 0), 0);
  const average = sum / data.length;

  return { average, count: data.length, error: null };
}
