/**
 * Cron Job: Auto-release escrow funds after 7 days
 * Requirements: 4.4
 *
 * This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
 * to automatically release funds from escrow transactions that have passed their auto-release date.
 */

import { NextRequest, NextResponse } from "next/server";
import { escrowService } from "@/lib/services/escrow";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Execute auto-release
    const result = await escrowService.autoReleaseFunds();

    return NextResponse.json({
      success: true,
      released_count: result.released_count,
      message: `Successfully auto-released ${result.released_count} escrow transaction(s)`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Auto-release cron job failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
