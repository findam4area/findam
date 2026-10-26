import { createClient } from "@/lib/supabase/client";
import type { Listing } from "@/lib/types";

/**
 * Like a listing
 * Increments the listing's like count and stores the user's like action
 */
export async function likeListing(
  listingId: string,
  userId: string,
): Promise<void> {
  const supabase = createClient();

  // Check if already liked
  const { data: existing } = await supabase
    .from("user_likes")
    .select("*")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .single();

  if (existing) {
    throw new Error("Listing already liked");
  }

  // Insert like record
  const { error: likeError } = await supabase
    .from("user_likes")
    .insert({ user_id: userId, listing_id: listingId });

  if (likeError) throw likeError;

  // Increment likes count
  const { error: updateError } = await (supabase as any).rpc(
    "increment_likes_count",
    {
      listing_id: listingId,
    },
  );

  if (updateError) {
    // Fallback to manual increment if RPC doesn't exist
    const { data: listing } = await supabase
      .from("listings")
      .select("likes_count")
      .eq("id", listingId)
      .single();

    if (listing && listing.likes_count !== null) {
      await supabase
        .from("listings")
        .update({ likes_count: listing.likes_count + 1 })
        .eq("id", listingId);
    } else if (listing) {
      await supabase
        .from("listings")
        .update({ likes_count: 1 })
        .eq("id", listingId);
    }
  }

  // Create notification for listing owner
  const { data: listing } = await supabase
    .from("listings")
    .select("user_id, title")
    .eq("id", listingId)
    .single();

  if (listing && listing.user_id !== userId) {
    await supabase.from("notifications").insert({
      user_id: listing.user_id,
      type: "listing_like",
      title: "Someone liked your listing",
      message: `Your listing "${listing.title}" received a like`,
      link: `/listings/${listingId}`,
    });
  }
}

/**
 * Unlike a listing
 * Decrements the listing's like count and removes the user's like action
 */
export async function unlikeListing(
  listingId: string,
  userId: string,
): Promise<void> {
  const supabase = createClient();

  // Delete like record
  const { error: deleteError } = await supabase
    .from("user_likes")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);

  if (deleteError) throw deleteError;

  // Decrement likes count
  const { error: updateError } = await (supabase as any).rpc(
    "decrement_likes_count",
    {
      listing_id: listingId,
    },
  );

  if (updateError) {
    // Fallback to manual decrement if RPC doesn't exist
    const { data: listing } = await supabase
      .from("listings")
      .select("likes_count")
      .eq("id", listingId)
      .single();

    if (listing && listing.likes_count !== null && listing.likes_count > 0) {
      await supabase
        .from("listings")
        .update({ likes_count: listing.likes_count - 1 })
        .eq("id", listingId);
    }
  }
}

/**
 * Check if user has liked a listing
 */
export async function hasLikedListing(
  listingId: string,
  userId: string,
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_likes")
    .select("*")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  return !!data;
}

/**
 * Save a listing to user's saved items collection
 */
export async function saveListing(
  listingId: string,
  userId: string,
): Promise<void> {
  const supabase = createClient();

  // Check if already saved
  const { data: existing } = await supabase
    .from("user_saves")
    .select("*")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .single();

  if (existing) {
    throw new Error("Listing already saved");
  }

  // Insert save record
  const { error: saveError } = await supabase
    .from("user_saves")
    .insert({ user_id: userId, listing_id: listingId });

  if (saveError) throw saveError;

  // Increment saves count
  const { error: updateError } = await (supabase as any).rpc(
    "increment_saves_count",
    {
      listing_id: listingId,
    },
  );

  if (updateError) {
    // Fallback to manual increment if RPC doesn't exist
    const { data: listing } = await supabase
      .from("listings")
      .select("saves_count")
      .eq("id", listingId)
      .single();

    if (listing && listing.saves_count !== null) {
      await supabase
        .from("listings")
        .update({ saves_count: listing.saves_count + 1 })
        .eq("id", listingId);
    } else if (listing) {
      await supabase
        .from("listings")
        .update({ saves_count: 1 })
        .eq("id", listingId);
    }
  }

  // Create notification for listing owner
  const { data: listing } = await supabase
    .from("listings")
    .select("user_id, title")
    .eq("id", listingId)
    .single();

  if (listing && listing.user_id !== userId) {
    await supabase.from("notifications").insert({
      user_id: listing.user_id,
      type: "listing_save",
      title: "Someone saved your listing",
      message: `Your listing "${listing.title}" was saved`,
      link: `/listings/${listingId}`,
    });
  }
}

/**
 * Unsave a listing from user's saved items collection
 */
export async function unsaveListing(
  listingId: string,
  userId: string,
): Promise<void> {
  const supabase = createClient();

  // Delete save record
  const { error: deleteError } = await supabase
    .from("user_saves")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);

  if (deleteError) throw deleteError;

  // Decrement saves count
  const { error: updateError } = await (supabase as any).rpc(
    "decrement_saves_count",
    {
      listing_id: listingId,
    },
  );

  if (updateError) {
    // Fallback to manual decrement if RPC doesn't exist
    const { data: listing } = await supabase
      .from("listings")
      .select("saves_count")
      .eq("id", listingId)
      .single();

    if (listing && listing.saves_count !== null && listing.saves_count > 0) {
      await supabase
        .from("listings")
        .update({ saves_count: listing.saves_count - 1 })
        .eq("id", listingId);
    }
  }
}

/**
 * Check if user has saved a listing
 */
export async function hasSavedListing(
  listingId: string,
  userId: string,
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_saves")
    .select("*")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  return !!data;
}

/**
 * Get all saved listings for a user
 */
export async function getSavedListings(userId: string): Promise<Listing[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_saves")
    .select(
      `
      created_at,
      listing:listings(
        *,
        user:users(id, username, avatar_url, trust_score),
        category:categories(id, name, icon),
        subcategory:subcategories(id, name),
        media:listing_media(*)
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Extract listings from the join result
  return (
    data?.map((item: any) => item.listing).filter((l: any) => l !== null) || []
  );
}

/**
 * Generate shareable link with Open Graph metadata
 */
export async function generateShareLink(listingId: string): Promise<string> {
  // Get the base URL from environment or window
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  return `${baseUrl}/listings/${listingId}`;
}

/**
 * Generate WhatsApp share link
 */
export async function generateWhatsAppShareLink(
  listingId: string,
): Promise<string> {
  const supabase = createClient();

  // Get listing details
  const { data: listing } = await supabase
    .from("listings")
    .select("title, price")
    .eq("id", listingId)
    .single();

  const shareUrl = await generateShareLink(listingId);

  // Format price if available
  const priceText = listing?.price
    ? ` for ₦${listing.price.toLocaleString()}`
    : "";

  const message = `Check out this listing on FindAm: ${listing?.title || "Listing"}${priceText}\n${shareUrl}`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Get interaction status for a listing (liked, saved)
 */
export async function getListingInteractionStatus(
  listingId: string,
  userId: string,
): Promise<{ isLiked: boolean; isSaved: boolean }> {
  const supabase = createClient();

  const [likedResult, savedResult] = await Promise.all([
    supabase
      .from("user_likes")
      .select("*")
      .eq("user_id", userId)
      .eq("listing_id", listingId)
      .single(),
    supabase
      .from("user_saves")
      .select("*")
      .eq("user_id", userId)
      .eq("listing_id", listingId)
      .single(),
  ]);

  return {
    isLiked: !!likedResult.data,
    isSaved: !!savedResult.data,
  };
}

/**
 * Get user's liked listings
 */
export async function getLikedListings(userId: string): Promise<Listing[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_likes")
    .select(
      `
      created_at,
      listing:listings(
        *,
        user:users(id, username, avatar_url, trust_score),
        category:categories(id, name, icon),
        subcategory:subcategories(id, name),
        media:listing_media(*)
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Extract listings from the join result
  return (
    data?.map((item: any) => item.listing).filter((l: any) => l !== null) || []
  );
}
