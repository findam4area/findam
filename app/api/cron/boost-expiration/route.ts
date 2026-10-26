/**
 * GET /api/cron/boost-expiration
 * Cron job to handle boost expiration and send notifications
 * Requirements: 14.6, 14.10
 * Tasks: 34.5, 34.7
 */

import { NextRequest, NextResponse } from "next/server";
import { boostService } from "@/lib/services/boost";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Send expiration notifications (6 hours before expiration)
    const notificationResult = await boostService.sendExpirationNotifications();

    // Expire boosts that have passed their expiration time
    const expirationResult = await boostService.expireBoosts();

    return NextResponse.json({
      success: true,
      notifications_sent: notificationResult.notified,
      boosts_expired: expirationResult.expired,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in boost expiration cron:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process boost expiration",
      },
      { status: 500 },
    );
  }
}
