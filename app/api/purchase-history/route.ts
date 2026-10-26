/**
 * Purchase History API
 * GET /api/purchase-history - Get user's purchase history with filters
 * Requirements: 20.1, 20.2, 20.3
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
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const deliveryStatus = searchParams.get("deliveryStatus");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build filters
    const filters: any = {};

    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    if (minPrice) {
      filters.minPrice = parseFloat(minPrice);
    }

    if (maxPrice) {
      filters.maxPrice = parseFloat(maxPrice);
    }

    if (deliveryStatus) {
      filters.deliveryStatus = deliveryStatus;
    }

    // Get purchase history
    const purchases = await PurchaseHistoryService.getPurchaseHistory(
      user.id,
      filters,
      limit,
      offset,
    );

    return NextResponse.json({
      purchases,
      count: purchases.length,
    });
  } catch (error) {
    console.error("Error fetching purchase history:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch purchase history",
      },
      { status: 500 },
    );
  }
}
