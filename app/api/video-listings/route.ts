/**
 * Video Listings API
 * Requirements: 1.1
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadVideo } from "@/lib/cloudinary/video";
import { validateVideoListing } from "@/lib/types/video";

/**
 * POST /api/video-listings
 * Upload video for a listing
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

    // Parse form data
    const formData = await request.formData();
    const videoFile = formData.get("video") as File;
    const listingId = formData.get("listingId") as string;

    if (!videoFile) {
      return NextResponse.json(
        { error: "Video file is required" },
        { status: 400 },
      );
    }

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 },
      );
    }

    // Verify listing exists and belongs to user
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, user_id")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.user_id !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to add video to this listing" },
        { status: 403 },
      );
    }

    // Upload video to Cloudinary
    const uploadResult = await uploadVideo(videoFile, {
      folder: "video-listings",
      minDuration: 15,
      maxDuration: 60,
    });

    // Validate video listing data
    const videoData = {
      listing_id: listingId,
      video_url: uploadResult.videoUrl,
      thumbnail_url: uploadResult.thumbnailUrl,
      duration_seconds: uploadResult.duration,
    };

    const validation = validateVideoListing(videoData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(", ") },
        { status: 400 },
      );
    }

    // Insert video listing record
    const { data: videoListing, error: insertError } = await supabase
      .from("video_listings")
      .insert(videoData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create video listing" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: videoListing,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/video-listings
 * Get video listings for feed
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const categoryId = searchParams.get("categoryId");

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("video_listings")
      .select(
        `
        *,
        listings:listing_id (
          id,
          title,
          price,
          category_id,
          user_id,
          users:user_id (
            id,
            username,
            avatar_url,
            phone_verified,
            nin_verified,
            video_verified
          )
        )
      `,
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by category if provided
    if (categoryId) {
      query = query.eq("listings.category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching video listings:", error);
      return NextResponse.json(
        { error: "Failed to fetch video listings" },
        { status: 500 },
      );
    }

    // Transform data to match VideoListing interface
    const videoListings = data?.map((item: any) => ({
      id: item.id,
      videoUrl: item.video_url,
      thumbnailUrl: item.thumbnail_url,
      duration: item.duration_seconds,
      product: {
        id: item.listings.id,
        title: item.listings.title,
        price: item.listings.price,
        currency: "NGN",
      },
      seller: {
        id: item.listings.users.id,
        username: item.listings.users.username,
        avatar: item.listings.users.avatar_url || "",
        verified:
          item.listings.users.phone_verified &&
          item.listings.users.nin_verified &&
          item.listings.users.video_verified,
      },
      views: item.views_count,
      likes: item.likes_count,
    }));

    return NextResponse.json({
      success: true,
      data: videoListings,
      pagination: {
        page,
        limit,
        hasMore: data?.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching video listings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
