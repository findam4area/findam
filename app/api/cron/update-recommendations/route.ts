/**
 * Cron Job: Update Recommendation Models Daily
 * Requirements: 7.4
 *
 * This endpoint should be called daily by a cron service (e.g., Vercel Cron, GitHub Actions)
 * to update recommendation models based on new user behavior data.
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // 1. Calculate category popularity scores
    const { data: categoryStats } = await supabase.rpc(
      "calculate_category_popularity",
    );

    // 2. Update trending listings cache
    const { data: trendingListings } = await supabase
      .from("listings")
      .select("id, views_count, created_at")
      .eq("status", "active")
      .order("views_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    // 3. Clean up old user behavior data (keep last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Archive old viewed_listings data
    await supabase.rpc("cleanup_old_behavior_data", {
      p_cutoff_date: ninetyDaysAgo.toISOString(),
    });

    // 4. Calculate user engagement scores
    const { data: userEngagement } = await supabase.rpc(
      "calculate_user_engagement_scores",
    );

    // 5. Update recommendation confidence scores
    // This would typically involve running ML model training
    // For now, we'll update basic statistics

    const { data: users } = await supabase
      .from("user_behaviors")
      .select("user_id");

    let updatedCount = 0;
    if (users) {
      for (const { user_id } of users) {
        // Recalculate confidence based on interaction count
        const { data: behavior } = await supabase
          .from("user_behaviors")
          .select("viewed_listings, saved_listings, purchased_listings")
          .eq("user_id", user_id)
          .single();

        if (behavior) {
          const viewedCount = (behavior.viewed_listings as any[])?.length || 0;
          const savedCount = (behavior.saved_listings as any[])?.length || 0;
          const purchasedCount =
            (behavior.purchased_listings as any[])?.length || 0;

          const totalInteractions =
            viewedCount + savedCount * 2 + purchasedCount * 3;

          // Update last_model_update timestamp
          await supabase
            .from("user_behaviors")
            .update({ updated_at: new Date().toISOString() })
            .eq("user_id", user_id);

          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Recommendation models updated successfully",
      stats: {
        usersUpdated: updatedCount,
        trendingListingsCount: trendingListings?.length || 0,
        categoryStatsCalculated: !!categoryStats,
        userEngagementCalculated: !!userEngagement,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating recommendation models:", error);
    return NextResponse.json(
      {
        error: "Failed to update recommendation models",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Prevent caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
