/**
 * Send Renewal Reminders Cron Job
 * Sends renewal reminders 7 days before subscription expiration
 * Requirements: 24.6
 * Task: 20.2
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const now = new Date();

    // Find pending renewal reminder notifications that are due
    const { data: pendingNotifications, error: fetchError } = await (
      supabase as any
    )
      .from("subscription_notifications")
      .select(
        `
        id,
        subscription_id,
        user_id,
        subject,
        message,
        subscriptions!inner(plan, price, current_period_end)
      `,
      )
      .eq("notification_type", "renewal_reminder")
      .eq("status", "pending")
      .lte("scheduled_for", now.toISOString());

    if (fetchError) {
      console.error("Failed to fetch pending notifications:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch pending notifications" },
        { status: 500 },
      );
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return NextResponse.json({
        message: "No pending renewal reminders found",
        sent: 0,
      });
    }

    // Send each notification
    const results = [];
    for (const notification of pendingNotifications) {
      try {
        // Create notification in notifications table
        const { error: notificationError } = await (supabase as any)
          .from("notifications")
          .insert({
            user_id: notification.user_id,
            type: "subscription_renewal_reminder",
            title: notification.subject,
            message: notification.message,
            link: "/premium",
            is_read: false,
          });

        if (notificationError) {
          throw new Error(
            `Failed to create notification: ${notificationError.message}`,
          );
        }

        // Mark notification as sent
        const { error: updateError } = await (supabase as any)
          .from("subscription_notifications")
          .update({
            status: "sent",
            sent_at: now.toISOString(),
          })
          .eq("id", notification.id);

        if (updateError) {
          console.error(
            `Failed to update notification status: ${updateError.message}`,
          );
        }

        results.push({
          notification_id: notification.id,
          user_id: notification.user_id,
          status: "sent",
        });
      } catch (error) {
        console.error(
          `Failed to send notification ${notification.id}:`,
          error,
        );

        // Mark notification as failed
        await (supabase as any)
          .from("subscription_notifications")
          .update({
            status: "failed",
          })
          .eq("id", notification.id);

        results.push({
          notification_id: notification.id,
          user_id: notification.user_id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: "Renewal reminders processing complete",
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    });
  } catch (error) {
    console.error("Send renewal reminders cron error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
