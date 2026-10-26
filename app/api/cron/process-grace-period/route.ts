/**
 * Process Grace Period Cron Job
 * Handles subscription grace period expiration and revokes access
 * Requirements: 24.7
 * Task: 20.2
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subscriptionService } from "@/lib/services/subscription";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // Find subscriptions with expired grace periods
    const { data: expiredGracePeriods, error: fetchError } = await (
      supabase as any
    )
      .from("subscriptions")
      .select("id, user_id, plan, grace_period_end")
      .eq("in_grace_period", true)
      .lt("grace_period_end", now);

    if (fetchError) {
      console.error("Failed to fetch expired grace periods:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch expired grace periods" },
        { status: 500 },
      );
    }

    if (!expiredGracePeriods || expiredGracePeriods.length === 0) {
      return NextResponse.json({
        message: "No expired grace periods found",
        processed: 0,
      });
    }

    // Process each expired grace period
    const results = [];
    for (const subscription of expiredGracePeriods) {
      try {
        // End grace period and revoke access
        await subscriptionService.endGracePeriod(subscription.user_id);

        // Send notification
        await (supabase as any).from("notifications").insert({
          user_id: subscription.user_id,
          type: "subscription_expired",
          title: "Subscription Expired",
          message: `Your ${subscription.plan} subscription has expired and the grace period has ended. You've been downgraded to the Basic plan. Upgrade anytime to regain premium features.`,
          link: "/premium",
          is_read: false,
        });

        results.push({
          subscription_id: subscription.id,
          user_id: subscription.user_id,
          status: "success",
        });
      } catch (error) {
        console.error(
          `Failed to process grace period for subscription ${subscription.id}:`,
          error,
        );
        results.push({
          subscription_id: subscription.id,
          user_id: subscription.user_id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: "Grace period processing complete",
      processed: results.length,
      success: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    });
  } catch (error) {
    console.error("Process grace period cron error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
