"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UpdateProfileInput } from "@/lib/validations/profile";
import { updateProfileSchema } from "@/lib/validations/profile";
import { calculateTrustScore } from "@/lib/api/profile";
import type { User } from "@/lib/types";
import { sanitizeInput, sanitizeUserContent } from "@/lib/utils/sanitization";

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: UpdateProfileInput,
) {
  try {
    // Validate input
    const validated = updateProfileSchema.parse(updates);

    // Sanitize text inputs to prevent XSS (Requirement 31.3)
    const sanitizedUpdates = {
      ...validated,
      username: validated.username
        ? sanitizeInput(validated.username)
        : undefined,
      bio: validated.bio ? sanitizeUserContent(validated.bio) : undefined,
    };

    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { error: "Unauthorized" };
    }

    // If username is being updated, check if it's already taken
    if (sanitizedUpdates.username) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", sanitizedUpdates.username)
        .neq("id", userId)
        .single();

      if (existingUser) {
        return { error: "Username already taken" };
      }
    }

    // Update profile
    const { data, error } = await supabase
      .from("users")
      .update({
        ...sanitizedUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/profile");
    revalidatePath(`/profile/${sanitizedUpdates.username || ""}`);

    return { data: data as User, error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update profile" };
  }
}

/**
 * Upload and update avatar
 */
export async function uploadAvatarAction(userId: string, formData: FormData) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { error: "Unauthorized" };
    }

    const file = formData.get("avatar") as File;
    if (!file) {
      return { error: "No file provided" };
    }

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      return { error: "File size must be less than 2MB" };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { error: "File must be JPEG, PNG, or WebP" };
    }

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
      return { error: uploadError.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Update user profile with new avatar URL
    const { data, error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath("/profile");

    return { data: { url: publicUrl, user: data as User }, error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to upload avatar" };
  }
}

/**
 * Update phone verification status
 */
export async function updatePhoneVerification(
  userId: string,
  verified: boolean,
) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { error: "Unauthorized" };
    }

    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !currentUser) {
      return { error: "User not found" };
    }

    // Update phone verification
    const updatedUser = {
      ...currentUser,
      phone_verified: verified,
    } as User;

    // Calculate new trust score
    const newTrustScore = calculateTrustScore(updatedUser);

    // Update user
    const { data, error } = await supabase
      .from("users")
      .update({
        phone_verified: verified,
        trust_score: newTrustScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/profile");

    return { data: data as User, error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update verification status" };
  }
}

/**
 * Update NIN verification status
 */
export async function updateNINVerification(userId: string, verified: boolean) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated (admin or self)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !currentUser) {
      return { error: "User not found" };
    }

    // Update NIN verification
    const updatedUser = {
      ...currentUser,
      nin_verified: verified,
    } as User;

    // Calculate new trust score
    const newTrustScore = calculateTrustScore(updatedUser);

    // Update user
    const { data, error } = await supabase
      .from("users")
      .update({
        nin_verified: verified,
        trust_score: newTrustScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/profile");

    return { data: data as User, error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update NIN verification" };
  }
}

/**
 * Update video verification status
 */
export async function updateVideoVerification(
  userId: string,
  verified: boolean,
) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated (admin or self)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !currentUser) {
      return { error: "User not found" };
    }

    // Update video verification
    const updatedUser = {
      ...currentUser,
      video_verified: verified,
    } as User;

    // Calculate new trust score
    const newTrustScore = calculateTrustScore(updatedUser);

    // Update user
    const { data, error } = await supabase
      .from("users")
      .update({
        video_verified: verified,
        trust_score: newTrustScore,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/profile");

    return { data: data as User, error: null };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update video verification" };
  }
}

/**
 * Get user profile with additional data
 * Fetches user profile, listings count, reviews, and calculates average rating
 */
export async function getUserProfileData(userId: string) {
  try {
    const supabase = await createClient();

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return { error: "User not found" };
    }

    // Get active listings count
    const { count: listingsCount } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true);

    // Get reviews
    const { data: reviews } = await supabase
      .from("reviews")
      .select(
        `
        *,
        reviewer:users!reviewer_id(id, username, avatar_url)
      `,
      )
      .eq("reviewed_user_id", userId)
      .order("created_at", { ascending: false });

    // Calculate average rating
    const averageRating =
      reviews && reviews.length > 0
        ? reviews.reduce((acc, review) => acc + (review.rating || 0), 0) /
          reviews.length
        : 0;

    return {
      data: {
        user: user as User,
        listingsCount: listingsCount || 0,
        reviews: reviews || [],
        averageRating,
      },
      error: null,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to fetch profile data" };
  }
}
