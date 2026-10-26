import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyticsService } from "@/lib/services/analytics";

/**
 * GET /api/analytics/export
 * Export analytics data to CSV format (Premium users only)
 * Requirements: 10.10
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

    // Check if user is premium
    const { data: userData, error: userError } = await (supabase as any)
      .from("users")
      .select("is_premium, premium_expires_at")
      .eq("id", user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: "Failed to verify user status" },
        { status: 500 },
      );
    }

    // Verify premium status
    if (!userData.is_premium) {
      return NextResponse.json(
        { error: "Premium subscription required for CSV export" },
        { status: 403 },
      );
    }

    // Check if premium is still active
    if (
      userData.premium_expires_at &&
      new Date(userData.premium_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: "Premium subscription has expired" },
        { status: 403 },
      );
    }

    // Generate CSV
    const csvContent = await analyticsService.exportToCSV(user.id);

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="findam-analytics-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Analytics export error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to export analytics",
      },
      { status: 500 },
    );
  }
}
