import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyticsService } from "@/lib/services/analytics";

/**
 * GET /api/analytics/dashboard
 * Get comprehensive analytics dashboard data for the authenticated seller
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9
 */
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

    // Get query parameters for filters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date") || undefined;
    const endDate = searchParams.get("end_date") || undefined;
    const listingId = searchParams.get("listing_id") || undefined;

    // Get dashboard data
    const dashboardData = await analyticsService.getDashboardData(user.id, {
      start_date: startDate,
      end_date: endDate,
      listing_id: listingId,
    });

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Analytics dashboard error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch analytics data",
      },
      { status: 500 },
    );
  }
}
