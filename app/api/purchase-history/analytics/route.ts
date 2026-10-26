/**
 * Purchase History Analytics API
 * GET /api/purchase-history/analytics - Get spending analytics
 * Requirements: 20.4
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PurchaseHistoryService } from "@/lib/services/purchase-history";

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get spending analytics
    const analytics = await PurchaseHistoryService.getSpendingAnalytics(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching spending analytics:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch spending analytics",
      },
      { status: 500 },
    );
  }
}
