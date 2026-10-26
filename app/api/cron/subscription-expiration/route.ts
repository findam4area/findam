/**
 * Subscription Expiration Cron Job
 * Handles automatic downgrade to Basic plan on subscription expiration
 * Requirements: 16.8
 * Task: 35.6
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

    // Find expired subscriptions
    const { data: expiredSubscriptions, error: fetchError } = await (
      supabase as any
    )
      .from("subscriptions")
      .select("user_id, plan, current_period_end")
      .in("status", ["active", "trial"])
      .lt("current_period_end", now)
      .neq("plan", "basic");

    if (fetchError) {
      console.error("Failed to fetch expired subscriptions:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch expired subscriptions" },
        { status: 500 },
      );
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      return NextResponse.json({
        message: "No expired subscriptions found",
        processed: 0,
      });
    }

    // Process each expired subscription
    const results = [];
    for (const subscription of expiredSubscriptions) {
      try {
        // Downgrade to basic
        await subscriptionService.handleExpiration(subscription.user_id);

        // Send notification
        await (supabase as any).from("notifications").insert({
          user_id: subscription.user_id,
          type: "subscription_expired",
          title: "Subscription Expired",
          message: `Your ${subscription.plan} subscription has expired. You've been downgraded to the Basic plan. Upgrade anytime to regain premium features.`,
          link: "/premium",
          is_read: false,
        });

        results.push({
          user_id: subscription.user_id,
          status: "success",
        });
      } catch (error) {
        console.error(
          `Failed to process expiration for user ${subscription.user_id}:`,
          error,
        );
        results.push({
          user_id: subscription.user_id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: "Subscription expiration processing complete",
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Subscription expiration cron error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
