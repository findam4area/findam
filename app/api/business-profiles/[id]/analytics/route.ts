import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";

/**
 * GET /api/business-profiles/[id]/analytics
 * 
 * Get analytics for a premium business profile
 * 
 * Task 11.4: Create premium analytics endpoint
 * Requirements: 15.4
 * 
 * @returns Analytics data including view count, engagement metrics
 * 
 * Features:
 * - Requires business owner or admin authentication
 * - Only available for premium businesses
 * - Returns view_count, click-through rates, engagement metrics
 * - Provides insights on profile performance
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view analytics." },
        { status: 401 },
      );
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid business profile ID format" },
        { status: 400 },
      );
    }

    // Check if business profile exists
    const { data: businessProfile, error: fetchError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !businessProfile) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 },
      );
    }

    // Check if user is the business owner or admin
    const adminCheck = await checkAdminAuth(supabase);
    const isOwner = businessProfile.user_id === user.id;
    const isAdmin = adminCheck.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          error:
            "Forbidden. You can only view analytics for your own business profile.",
        },
        { status: 403 },
      );
    }

    // Check if business is premium
    if (!businessProfile.is_premium) {
      return NextResponse.json(
        {
          error:
            "This feature is only available for premium business profiles. Upgrade to premium to access analytics.",
          upgrade_link: `/business-profiles/${id}/premium`,
        },
        { status: 403 },
      );
    }

    // Check if premium has expired
    if (
      businessProfile.premium_expires_at &&
      new Date(businessProfile.premium_expires_at) < new Date()
    ) {
      return NextResponse.json(
        {
          error:
            "Your premium subscription has expired. Renew to continue accessing analytics.",
          renew_link: `/business-profiles/${id}/premium`,
        },
        { status: 403 },
      );
    }

    // Calculate analytics metrics

    // 1. View count (already tracked in business_profiles table)
    const view_count = businessProfile.view_count || 0;

    // 2. Review engagement
    const { data: reviews, error: reviewsError } = await supabase
      .from("business_reviews")
      .select("rating, created_at")
      .eq("business_profile_id", id)
      .eq("is_flagged", false);

    const total_reviews = reviews?.length || 0;
    const average_rating = businessProfile.average_rating || 0;

    // Calculate reviews by time period (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recent_reviews = reviews
      ? reviews.filter(
          (review) => review.created_at && new Date(review.created_at) >= thirtyDaysAgo,
        ).length
      : 0;

    // 3. Product/Service engagement
    const { data: products, error: productsError } = await supabase
      .from("product_listings")
      .select("id, title, is_featured")
      .eq("business_profile_id", id)
      .eq("is_active", true);

    const { data: services, error: servicesError } = await supabase
      .from("service_listings")
      .select("id, title, is_featured")
      .eq("business_profile_id", id)
      .eq("is_active", true);

    const total_products = products?.length || 0;
    const total_services = services?.length || 0;
    const featured_products =
      products?.filter((p) => p.is_featured).length || 0;
    const featured_services =
      services?.filter((s) => s.is_featured).length || 0;

    // 4. Profile completeness
    const completeness_percentage = businessProfile.completeness_percentage || 0;

    // 5. Premium tier information
    const premium_tier = businessProfile.premium_tier || "basic";
    const premium_expires_at = businessProfile.premium_expires_at;
    const days_until_expiration = premium_expires_at
      ? Math.ceil(
          (new Date(premium_expires_at).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    // 6. Estimate click-through rate (CTR)
    // In a real implementation, this would track actual clicks on products/services/contact buttons
    // For now, we'll estimate based on views and engagement
    const estimated_ctr =
      view_count > 0
        ? ((total_reviews + featured_products + featured_services) /
            view_count) *
          100
        : 0;

    // 7. Calculate engagement score (0-100)
    const engagement_score = Math.min(
      100,
      Math.round(
        (completeness_percentage * 0.3 +
          (total_reviews > 0 ? 20 : 0) +
          (total_products > 0 || total_services > 0 ? 20 : 0) +
          (featured_products + featured_services > 0 ? 15 : 0) +
          (average_rating >= 4.0 ? 15 : average_rating >= 3.0 ? 10 : 0)),
      ),
    );

    // Build analytics response
    const analytics = {
      business_profile_id: id,
      business_name: businessProfile.business_name,
      premium_tier,
      premium_expires_at,
      days_until_expiration,
      
      // Core metrics
      view_count,
      completeness_percentage,
      engagement_score,
      
      // Review metrics
      total_reviews,
      recent_reviews_30d: recent_reviews,
      average_rating: parseFloat(average_rating.toFixed(2)),
      
      // Product/Service metrics
      total_products,
      total_services,
      featured_products,
      featured_services,
      
      // Estimated metrics (in production, track actual clicks)
      estimated_click_through_rate: parseFloat(estimated_ctr.toFixed(2)),
      
      // Performance insights
      insights: generateInsights(
        view_count,
        total_reviews,
        completeness_percentage,
        total_products + total_services,
        engagement_score,
      ),
    };

    return NextResponse.json({
      success: true,
      analytics,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in premium analytics endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Generate actionable insights based on analytics data
 */
function generateInsights(
  view_count: number,
  total_reviews: number,
  completeness: number,
  total_listings: number,
  engagement_score: number,
): string[] {
  const insights: string[] = [];

  if (completeness < 100) {
    insights.push(
      `Your profile is ${completeness}% complete. Complete your profile to improve visibility.`,
    );
  }

  if (total_reviews < 5) {
    insights.push(
      "Ask satisfied customers to leave reviews to build trust and credibility.",
    );
  }

  if (total_listings === 0) {
    insights.push(
      "Add products or services to your profile to attract more customers.",
    );
  }

  if (view_count < 50) {
    insights.push(
      "Share your business profile link on social media to increase visibility.",
    );
  }

  if (engagement_score < 50) {
    insights.push(
      "Your engagement score is low. Focus on completing your profile, adding listings, and encouraging reviews.",
    );
  } else if (engagement_score >= 80) {
    insights.push(
      "Excellent engagement! Your business profile is performing well.",
    );
  }

  return insights;
}
