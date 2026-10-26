/**
 * Video Feed API (Alias for video-listings GET endpoint)
 * Requirements: 1.1, 1.6
 * 
 * This endpoint is an alias for GET /api/video-listings
 * It provides the same functionality with a more semantic name for the video feed feature.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/video-feed
 * Get video listings for the video feed
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - categoryId: Filter by category (optional)
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
      console.error("Error fetching video feed:", error);
      return NextResponse.json(
        { error: "Failed to fetch video feed" },
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
    console.error("Error fetching video feed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
