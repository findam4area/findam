/**
 * Recommendations API Route
 * Requirements: 7.2, 7.3, 7.6, 7.7, 7.9
 */

import { createClient } from "@/lib/supabase/server";
import { RecommendationService } from "@/lib/services/recommendation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const excludeIds = searchParams.get("exclude")?.split(",") || [];
    const categoryId = searchParams.get("category") || undefined;

    // Check if user has opted out of personalized recommendations (using any type for non-existent field)
    const { data: profile } = await (supabase.from as any)("profiles")
      .select("personalized_recommendations_enabled")
      .eq("id", user.id)
      .single();

    // If opted out, return trending items
    if (profile && profile.personalized_recommendations_enabled === false) {
      const { data: trendingListings } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .order("views_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

      return NextResponse.json({
        listings: trendingListings || [],
        algorithm: "trending",
        confidence: 0.5,
        personalized: false,
      });
    }

    // Generate personalized recommendations
    const recommendations = await RecommendationService.generateRecommendations(
      {
        userId: user.id,
        limit,
        excludeListingIds: excludeIds,
        categoryId,
      },
    );

    return NextResponse.json({
      ...recommendations,
      personalized: true,
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 },
    );
  }
}
