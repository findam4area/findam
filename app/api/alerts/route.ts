/**
 * Alerts API
 * Handles fetching and managing search alerts
 * Requirements: 13.3, 13.4, 13.10
 */

import { NextRequest, NextResponse } from "next/server";
import { AlertService } from "@/lib/services/alert";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const alerts = await AlertService.getUserAlerts({
      userId: user.id,
      limit,
      offset,
      unreadOnly,
    });

    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch alerts" },
      { status: 500 },
    );
  }
}
