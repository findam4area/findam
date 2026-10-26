import { createClient } from "@/lib/supabase/client";
import type {
  Listing,
  ListingMedia,
  ListingFilters,
  PaginatedResponse,
} from "@/lib/types";

export interface CreateListingInput {
  title: string;
  description: string;
  price?: number;
  category_id: string;
  subcategory_id: string;
  condition?: "new" | "used" | "refurbished";
  state: string;
  area?: string;
  media?: File[];
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  price?: number;
  category_id?: string;
  subcategory_id?: string;
  condition?: "new" | "used" | "refurbished";
  state?: string;
  area?: string;
}

/**
 * Generate video thumbnail from video file
 */
export async function generateVideoThumbnail(videoFile: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoFile);
    video.currentTime = 1; // Capture at 1 second

    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(video, 0, 0);
      URL.revokeObjectURL(video.src);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to generate thumbnail"));
        },
        "image/jpeg",
        0.8,
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video"));
    };
  });
}

/**
 * Upload media file to Supabase Storage
 */
export async function uploadMedia(
  file: File,
  bucket: string = "listing-media",
): Promise<string> {
  const supabase = createClient();

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Get video duration in seconds
 */
export async function getVideoDuration(videoFile: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.floor(video.duration));
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video"));
    };
  });
}

/**
 * Create a new listing
 */
export async function createListing(
  input: CreateListingInput,
  userId: string,
): Promise<Listing> {
  const supabase = createClient();

  // Check if user is phone verified
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("phone_verified, is_premium")
    .eq("id", userId)
    .single();

  if (userError) throw userError;
  if (!user.phone_verified) {
    throw new Error("Phone verification required to create listings");
  }

  // Check listing limit for free tier users
  if (!user.is_premium) {
    const { count, error: countError } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (countError) throw countError;
    if (count && count >= 3) {
      throw new Error(
        "Free tier users can only have 3 active listings. Upgrade to premium for more.",
      );
    }
  }

  // Create listing
  const { data: listing, error: listingError } = await (supabase as any)
    .from("listings")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description,
      price: input.price,
      category_id: input.category_id,
      subcategory_id: input.subcategory_id,
      condition: input.condition,
      state: input.state,
      lga: input.area ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (listingError) throw listingError;

  // Handle media uploads if provided
  if (input.media && input.media.length > 0) {
    const mediaRecords: Array<{
      listing_id: string;
      media_url: string;
      media_type: "image" | "video";
      duration_seconds?: number;
      display_order: number;
    }> = [];

    let thumbnailUrl: string | null = null;

    for (let i = 0; i < input.media.length; i++) {
      const file = input.media[i];
      const isVideo = file.type.startsWith("video/");

      // Validate video duration
      if (isVideo) {
        const duration = await getVideoDuration(file);
        if (duration > 30) {
          throw new Error("Video duration must be 30 seconds or less");
        }

        // Upload video
        const videoUrl = await uploadMedia(file);

        // Generate and upload thumbnail
        const thumbnailBlob = await generateVideoThumbnail(file);
        const thumbnailFile = new File(
          [thumbnailBlob],
          `thumb-${file.name}.jpg`,
          {
            type: "image/jpeg",
          },
        );
        const thumbUrl = await uploadMedia(thumbnailFile);

        // Set first video thumbnail as listing thumbnail
        if (!thumbnailUrl) {
          thumbnailUrl = thumbUrl;
        }

        mediaRecords.push({
          listing_id: listing.id,
          media_url: videoUrl,
          media_type: "video",
          duration_seconds: duration,
          display_order: i,
        });
      } else {
        // Upload image
        const imageUrl = await uploadMedia(file);

        // Set first image as listing thumbnail
        if (!thumbnailUrl) {
          thumbnailUrl = imageUrl;
        }

        mediaRecords.push({
          listing_id: listing.id,
          media_url: imageUrl,
          media_type: "image",
          display_order: i,
        });
      }
    }

    // Insert media records
    const { error: mediaError } = await supabase
      .from("listing_media")
      .insert(mediaRecords);

    if (mediaError) throw mediaError;

    // Update listing with thumbnail
    if (thumbnailUrl) {
      const { error: updateError } = await supabase
        .from("listings")
        .update({ thumbnail_url: thumbnailUrl })
        .eq("id", listing.id);

      if (updateError) throw updateError;
      listing.thumbnail_url = thumbnailUrl;
    }
  }

  return listing as Listing;
}

/**
 * Get a single listing by ID
 */
export async function getListing(id: string): Promise<Listing | null> {
  const supabase = createClient();

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

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as unknown as Listing;
}

/**
 * Get listings with filters and pagination
 */
export async function getListings(
  filters: ListingFilters = {},
  page: number = 0,
  limit: number = 20,
): Promise<PaginatedResponse<Listing>> {
  const supabase = createClient();

  let query = supabase
    .from("listings")
    .select(
      `
      *,
      user:users(id, username, avatar_url, trust_score),
      category:categories(id, name, icon),
      subcategory:subcategories(id, name),
      media:listing_media(*)
    `,
      { count: "exact" },
    )
    .eq("is_active", true);

  // Apply filters
  if (filters.category_id) {
    query = query.eq("category_id", filters.category_id);
  }
  if (filters.subcategory_id) {
    query = query.eq("subcategory_id", filters.subcategory_id);
  }
  if (filters.min_price !== undefined) {
    query = query.gte("price", filters.min_price);
  }
  if (filters.max_price !== undefined) {
    query = query.lte("price", filters.max_price);
  }
  if (filters.condition) {
    query = query.eq("condition", filters.condition);
  }
  if (filters.state) {
    query = query.eq("state", filters.state);
  }
  if (filters.area) {
    query = query.eq("lga", filters.area);
  }
  // Legacy lga field maps to lga
  if (filters.lga) {
    query = query.eq("lga", filters.lga);
  }
  if (filters.search_query) {
    query = query.or(
      `title.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`,
    );
  }

  // Apply sorting
  switch (filters.sort_by) {
    case "price_asc":
      query = query.order("price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false, nullsFirst: false });
      break;
    case "date_asc":
      query = query.order("created_at", { ascending: true });
      break;
    case "date_desc":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Apply pagination
  const start = page * limit;
  const end = start + limit - 1;
  query = query.range(start, end);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data as unknown as Listing[]) || [],
    total: count || 0,
    page,
    limit,
    hasMore: count ? start + limit < count : false,
  };
}

/**
 * Get feed listings with boosted listings prioritized
 * Uses cursor-based pagination for better performance
 */
export async function getFeedListings(
  cursor?: string,
  limit: number = 20,
  filters: ListingFilters = {},
): Promise<{ data: Listing[]; nextCursor?: string; hasMore: boolean }> {
  const supabase = createClient();

  // First, get boosted listings that haven't expired
  const now = new Date().toISOString();
  let boostedQuery = (supabase as any)
    .from("listings")
    .select(
      `
      *,
      user:users(id, username, avatar_url, trust_score),
      category:categories(id, name, icon),
      subcategory:subcategories(id, name),
      media:listing_media(*)
    `,
    )
    .eq("is_active", true)
    .eq("is_boosted", true)
    .gt("boost_expires_at", now);

  // Apply filters to boosted listings
  if (filters.category_id) {
    boostedQuery = boostedQuery.eq("category_id", filters.category_id);
  }
  if (filters.subcategory_id) {
    boostedQuery = boostedQuery.eq("subcategory_id", filters.subcategory_id);
  }
  if (filters.state) {
    boostedQuery = boostedQuery.eq("state", filters.state);
  }

  boostedQuery = boostedQuery
    .order("boost_expires_at", { ascending: false })
    .limit(5);

  const { data: boostedListings, error: boostedError } = await boostedQuery;

  if (boostedError) throw boostedError;

  // Then get regular listings with cursor-based pagination
  let regularQuery = (supabase as any)
    .from("listings")
    .select(
      `
      *,
      user:users(id, username, avatar_url, trust_score),
      category:categories(id, name, icon),
      subcategory:subcategories(id, name),
      media:listing_media(*)
    `,
    )
    .eq("is_active", true);

  // Exclude boosted listings from regular feed
  if (boostedListings && boostedListings.length > 0) {
    const boostedIds = boostedListings.map((l: any) => l.id);
    regularQuery = regularQuery.not("id", "in", `(${boostedIds.join(",")})`);
  }

  // Apply filters
  if (filters.category_id) {
    regularQuery = regularQuery.eq("category_id", filters.category_id);
  }
  if (filters.subcategory_id) {
    regularQuery = regularQuery.eq("subcategory_id", filters.subcategory_id);
  }
  if (filters.min_price !== undefined) {
    regularQuery = regularQuery.gte("price", filters.min_price);
  }
  if (filters.max_price !== undefined) {
    regularQuery = regularQuery.lte("price", filters.max_price);
  }
  if (filters.condition) {
    regularQuery = regularQuery.eq("condition", filters.condition);
  }
  if (filters.state) {
    regularQuery = regularQuery.eq("state", filters.state);
  }
  if (filters.area) {
    regularQuery = regularQuery.eq("lga", filters.area);
  }
  if (filters.search_query) {
    regularQuery = regularQuery.or(
      `title.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`,
    );
  }

  // Apply cursor-based pagination
  if (cursor) {
    regularQuery = regularQuery.lt("created_at", cursor);
  }

  regularQuery = regularQuery
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data: regularListings, error: regularError } = await regularQuery;

  if (regularError) throw regularError;

  // Combine boosted and regular listings
  const allListings = cursor
    ? regularListings || []
    : [...(boostedListings || []), ...(regularListings || [])];

  // Determine next cursor and hasMore
  const hasMore = regularListings && regularListings.length === limit;
  const nextCursor =
    hasMore && regularListings && regularListings.length > 0
      ? regularListings[regularListings.length - 1].created_at
      : undefined;

  return {
    data: allListings as unknown as Listing[],
    nextCursor,
    hasMore: hasMore || false,
  };
}

/**
 * Update a listing
 */
export async function updateListing(
  id: string,
  input: UpdateListingInput,
  userId: string,
): Promise<Listing> {
  const supabase = createClient();

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  if (existing.user_id !== userId) {
    throw new Error("Unauthorized: You can only update your own listings");
  }

  // Update listing
  const { data, error } = await supabase
    .from("listings")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Listing;
}

/**
 * Delete a listing (soft delete by marking inactive)
 */
export async function deleteListing(id: string, userId: string): Promise<void> {
  const supabase = createClient();

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  if (existing.user_id !== userId) {
    throw new Error("Unauthorized: You can only delete your own listings");
  }

  // Soft delete
  const { error } = await supabase
    .from("listings")
    .update({ is_active: false })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Get user's listings
 */
export async function getUserListings(
  userId: string,
  activeOnly: boolean = true,
): Promise<Listing[]> {
  const supabase = createClient();

  let query = supabase
    .from("listings")
    .select(
      `
      *,
      media:listing_media(*)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data as Listing[]) || [];
}
