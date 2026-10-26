"use server";

import { createClient } from "@/lib/supabase/server";
import { listingSchema } from "@/lib/validations/listing";
import { revalidatePath } from "next/cache";
import type { Listing } from "@/lib/types";
import { detectScamPatterns, shouldAutoFlag } from "@/lib/utils/scam-detection";
import { isPremiumActive, getListingLimits } from "@/lib/utils/premium";
import { validateCategoryHierarchy } from "@/lib/utils/category-helpers";
import { sanitizeText } from "@/lib/utils/sanitize";

export async function createListingAction(formData: FormData) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  // Validate form data
  const validated = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price")
      ? parseFloat(formData.get("price") as string)
      : undefined,
    category_id: formData.get("category_id"),
    subcategory_id: formData.get("subcategory_id"),
    condition: formData.get("condition") || undefined,
    state: formData.get("state"),
    lga: formData.get("lga"),
    area: formData.get("area") || undefined,
  });

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  // Sanitize text inputs to prevent XSS
  const sanitizedData = {
    ...validated.data,
    title: sanitizeText(validated.data.title),
    description: sanitizeText(validated.data.description),
  };

  // Validate category hierarchy
  const categoryValidation = await validateCategoryHierarchy(
    sanitizedData.category_id,
    sanitizedData.subcategory_id,
  );

  if (!categoryValidation.valid) {
    return { error: categoryValidation.error || "Invalid category selection" };
  }

  try {
    // Check if user is phone verified
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("phone_verified, is_premium, premium_expires_at")
      .eq("id", user.id)
      .single();

    if (userError) throw userError;
    if (!userData || !userData.phone_verified) {
      return { error: "Phone verification required to create listings" };
    }

    // Check premium status
    const isPremium = isPremiumActive({
      is_premium: userData.is_premium ?? false,
      premium_expires_at: userData.premium_expires_at,
    });

    // Check listing limit based on tier
    const { count, error: countError } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (countError) throw countError;

    const currentCount = count || 0;
    const limits = getListingLimits(isPremium, currentCount);

    if (!limits.can_create) {
      const maxListings = isPremium ? 30 : 3;
      return {
        error: isPremium
          ? `Premium users can have up to ${maxListings} active listings. You have reached the limit.`
          : `Free tier users can only have ${maxListings} active listings. Upgrade to premium for up to 30 listings.`,
      };
    }

    // Create listing
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({
        user_id: user.id,
        ...sanitizedData,
      } as any)
      .select(
        `
        *,
        category:categories(id, name),
        subcategory:subcategories(id, name)
      `,
      )
      .single();

    if (listingError) throw listingError;

    // Run scam detection
    const scamResult = detectScamPatterns(listing as unknown as Listing);

    // If suspicious, flag for review
    if (shouldAutoFlag(scamResult)) {
      await supabase.from("reports").insert({
        reporter_id: "system",
        listing_id: listing.id,
        reason: "scam_detection",
        description: `Auto-flagged by ScamShield AI: ${scamResult.reasons.join("; ")}`,
        status: "pending",
      });

      // If high confidence scam, hide immediately
      if (scamResult.confidence >= 0.8) {
        await supabase
          .from("listings")
          .update({ is_active: false })
          .eq("id", listing.id);

        return {
          error:
            "Your listing has been flagged for review due to suspicious content. Please contact support if you believe this is an error.",
        };
      }
    }

    revalidatePath("/feed");
    revalidatePath("/profile");

    return {
      success: true,
      data: listing,
      scam_warning: scamResult.is_suspicious
        ? "Your listing has some characteristics that may appear suspicious to buyers. Please ensure all information is accurate."
        : undefined,
    };
  } catch (error) {
    console.error("Error creating listing:", error);
    return { error: "Failed to create listing" };
  }
}

export async function updateListingAction(id: string, formData: FormData) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  // Validate form data
  const validated = listingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price")
      ? parseFloat(formData.get("price") as string)
      : undefined,
    category_id: formData.get("category_id"),
    subcategory_id: formData.get("subcategory_id"),
    condition: formData.get("condition") || undefined,
    state: formData.get("state"),
    lga: formData.get("lga"),
    area: formData.get("area") || undefined,
  });

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  // Sanitize text inputs to prevent XSS
  const sanitizedData = {
    ...validated.data,
    title: sanitizeText(validated.data.title),
    description: sanitizeText(validated.data.description),
  };

  // Validate category hierarchy
  const categoryValidation = await validateCategoryHierarchy(
    sanitizedData.category_id,
    sanitizedData.subcategory_id,
  );

  if (!categoryValidation.valid) {
    return { error: categoryValidation.error || "Invalid category selection" };
  }

  try {
    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("listings")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (existing.user_id !== user.id) {
      return { error: "Unauthorized: You can only update your own listings" };
    }

    // Update listing
    const { data, error } = await supabase
      .from("listings")
      .update({
        ...sanitizedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/feed");
    revalidatePath(`/listing/${id}`);
    revalidatePath("/profile");

    return { success: true, data };
  } catch (error) {
    console.error("Error updating listing:", error);
    return { error: "Failed to update listing" };
  }
}

export async function deleteListingAction(id: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  try {
    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("listings")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (existing.user_id !== user.id) {
      return { error: "Unauthorized: You can only delete your own listings" };
    }

    // Soft delete
    const { error } = await supabase
      .from("listings")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/feed");
    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("Error deleting listing:", error);
    return { error: "Failed to delete listing" };
  }
}

export async function getListingAction(id: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("listings")
      .select(
        `
      *,
      user:users(*),
      category:categories(*),
      subcategory:subcategories(*),
      media:listing_media(*)
    `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    return { success: true, data: data as unknown as Listing };
  } catch (error) {
    console.error("Error fetching listing:", error);
    return { error: "Failed to fetch listing" };
  }
}

export async function getUserListingsAction(userId?: string) {
  const supabase = await createClient();

  try {
    // If no userId provided, get current user's listings
    let targetUserId = userId;
    if (!targetUserId) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        return { error: "Unauthorized" };
      }
      targetUserId = user.id;
    }

    const { data, error } = await supabase
      .from("listings")
      .select(
        `
      *,
      media:listing_media(*)
    `,
      )
      .eq("user_id", targetUserId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data: data as Listing[] };
  } catch (error) {
    console.error("Error fetching user listings:", error);
    return { error: "Failed to fetch listings" };
  }
}
