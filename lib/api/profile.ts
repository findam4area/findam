import { createClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";
import type { UpdateProfileInput } from "@/lib/validations/profile";

/**
 * Get user profile by ID (client-side)
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      fullError: JSON.stringify(error, null, 2),
    });
    return null;
  }

  return data as User;
}

/**
 * Get user profile by username (client-side)
 */
export async function getUserProfileByUsername(
  username: string,
): Promise<User | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    console.error("Error fetching user profile by username:", error);
    return null;
  }

  return data as User;
}

/**
 * Update user profile (client-side)
 */
export async function updateUserProfile(
  userId: string,
  updates: UpdateProfileInput,
): Promise<{ data: User | null; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as User, error: null };
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Update user profile with new avatar URL
  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateError) {
    return { url: null, error: updateError.message };
  }

  return { url: publicUrl, error: null };
}

/**
 * Calculate Trust Score based on verification status and reviews
 */
export function calculateTrustScore(
  user: User,
  averageRating?: number,
): number {
  let score = 0;

  // Base score from verifications
  if (user.phone_verified) score += 30;
  if (user.nin_verified) score += 40;
  if (user.video_verified) score += 30;

  // If all verifications complete, set to 100
  if (user.phone_verified && user.nin_verified && user.video_verified) {
    return 100;
  }

  // Add score from reviews (if provided)
  if (averageRating !== undefined) {
    const reviewScore = (averageRating / 5) * 30; // Max 30 points from reviews
    score = Math.min(score + reviewScore, 100);
  }

  return Math.round(score);
}

/**
 * Update Trust Score for a user
 */
export async function updateTrustScore(
  userId: string,
  averageRating?: number,
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  // Get current user data
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (fetchError || !user) {
    return { success: false, error: "User not found" };
  }

  // Calculate new trust score
  const newScore = calculateTrustScore(user as User, averageRating);

  // Update user's trust score
  const { error: updateError } = await supabase
    .from("users")
    .update({ trust_score: newScore, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, error: null };
}

/**
 * Get user's active listings count
 */
export async function getUserActiveListingsCount(
  userId: string,
): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching listings count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get user's reviews
 */
export async function getUserReviews(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      *,
      reviewer:users!reviewer_id(id, username, avatar_url)
    `,
    )
    .eq("reviewed_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return data;
}

/**
 * Get user's average rating
 */
export async function getUserAverageRating(userId: string): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewed_user_id", userId);

  if (error || !data || data.length === 0) {
    return 0;
  }

  const sum = data.reduce((acc, review) => acc + (review.rating ?? 0), 0);
  return sum / data.length;
}

/**
 * Server-side: Get user profile by ID
 */
export async function getServerUserProfile(
  userId: string,
): Promise<User | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile (server):", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      fullError: JSON.stringify(error, null, 2),
    });
    return null;
  }

  return data as User;
}
