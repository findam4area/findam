/**
 * GET /api/cron/auto-disable-searches
 * Cron job to auto-disable saved searches after 90 days of inactivity
 * Requirements: 13.8
 * Task: 42.9
 *
 * This should run daily
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Call the database function to auto-disable inactive searches
    const { error } = await (supabase.rpc as any)(
      "auto_disable_inactive_searches",
    );

    if (error) {
      throw new Error(`Failed to auto-disable searches: ${error.message}`);
    }

    // Get count of disabled searches
    const { count } = await (supabase.from as any)("saved_searches")
      .select("*", { count: "exact", head: true })
      .eq("is_active", false)
      .eq("disabled_reason", "Auto-disabled after 90 days of inactivity");

    return NextResponse.json({
      success: true,
      searches_disabled: count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in auto-disable-searches cron:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to auto-disable searches",
      },
      { status: 500 },
    );
  }
}
