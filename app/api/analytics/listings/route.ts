import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPremiumActive } from "@/lib/utils/premium";

export async function GET(_request: NextRequest) {
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

    // Get user premium status
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_premium, premium_expires_at")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if premium is active (handle null is_premium)
    const isPremium = isPremiumActive({
      is_premium: userData.is_premium ?? false,
      premium_expires_at: userData.premium_expires_at,
    });

    if (!isPremium) {
      return NextResponse.json(
        { error: "Premium subscription required" },
        { status: 403 },
      );
    }

    // Get user's listings with analytics data
    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select("id, title, views_count, likes_count, saves_count, created_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (listingsError) {
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: 500 },
      );
    }

    // Calculate aggregate statistics
    const totalViews = listings.reduce(
      (sum, listing) => sum + (listing.views_count || 0),
      0,
    );
    const totalLikes = listings.reduce(
      (sum, listing) => sum + (listing.likes_count || 0),
      0,
    );
    const totalSaves = listings.reduce(
      (sum, listing) => sum + (listing.saves_count || 0),
      0,
    );

    // Calculate engagement rate (likes + saves / views)
    const engagementRate =
      totalViews > 0 ? ((totalLikes + totalSaves) / totalViews) * 100 : 0;

    // Get top performing listings
    const topListings = [...listings]
      .sort((a, b) => {
        const scoreA =
          (a.views_count || 0) +
          (a.likes_count || 0) * 2 +
          (a.saves_count || 0) * 3;
        const scoreB =
          (b.views_count || 0) +
          (b.likes_count || 0) * 2 +
          (b.saves_count || 0) * 3;
        return scoreB - scoreA;
      })
      .slice(0, 5);

    // Get views over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentListings = listings.filter((listing) => {
      if (!listing.created_at) return false;
      return new Date(listing.created_at) >= thirtyDaysAgo;
    });

    return NextResponse.json({
      summary: {
        total_listings: listings.length,
        total_views: totalViews,
        total_likes: totalLikes,
        total_saves: totalSaves,
        engagement_rate: Math.round(engagementRate * 100) / 100,
        average_views_per_listing:
          listings.length > 0 ? Math.round(totalViews / listings.length) : 0,
      },
      top_listings: topListings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        views: listing.views_count || 0,
        likes: listing.likes_count || 0,
        saves: listing.saves_count || 0,
      })),
      recent_activity: {
        listings_created_last_30_days: recentListings.length,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
