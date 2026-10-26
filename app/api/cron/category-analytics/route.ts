/**
 * GET /api/cron/category-analytics
 * Cron job to aggregate category analytics daily at midnight UTC
 * Task 15.2: Create scheduled job for analytics aggregation
 * Requirement: 20.7
 *
 * This endpoint should be called daily at midnight UTC by a cron service (e.g., Vercel Cron, GitHub Actions)
 * to aggregate category analytics including business counts, search counts, and view counts.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { aggregateCategoryAnalytics } from "@/lib/utils/category-analytics";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[CategoryAnalyticsCron] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CategoryAnalyticsCron] Starting daily category analytics aggregation");

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[CategoryAnalyticsCron] Missing Supabase configuration");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Aggregate analytics for yesterday (default behavior)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const analyticsData = await aggregateCategoryAnalytics(
      supabase as any,
      yesterday,
      "daily",
    );

    console.log(
      `[CategoryAnalyticsCron] Successfully aggregated analytics for ${analyticsData.length} categories`,
    );

    return NextResponse.json({
      success: true,
      categories_processed: analyticsData.length,
      period_date: yesterday.toISOString().split("T")[0],
      period_type: "daily",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CategoryAnalyticsCron] Error in category analytics cron:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to aggregate category analytics",
      },
      { status: 500 },
    );
  }
}
