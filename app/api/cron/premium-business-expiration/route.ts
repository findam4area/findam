import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Cron job to handle expired premium business profile subscriptions
 * 
 * Task 11.3: Implement premium expiration check
 * Requirements: 15.7
 * 
 * This should be called periodically (e.g., daily) by a scheduler like Vercel Cron
 * 
 * Features:
 * - Queries businesses where is_premium=true AND premium_expires_at < NOW()
 * - Sets is_premium=false for expired subscriptions
 * - Sends renewal notification 7 days before expiration
 * - Creates notifications for expired and expiring subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date();
    const nowISO = now.toISOString();

    // Calculate date 7 days from now for renewal notifications
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysFromNowISO = sevenDaysFromNow.toISOString();

    // 1. Find and expire premium subscriptions that have passed their expiration date
    const { data: expiredBusinesses, error: expiredError } = await supabase
      .from("business_profiles")
      .select("id, business_name, user_id, premium_tier, premium_expires_at")
      .eq("is_premium", true)
      .lt("premium_expires_at", nowISO);

    let expiredCount = 0;

    if (!expiredError && expiredBusinesses && expiredBusinesses.length > 0) {
      for (const business of expiredBusinesses) {
        // Set is_premium to false
        const { error: updateError } = await supabase
          .from("business_profiles")
          .update({
            is_premium: false,
            premium_tier: null,
          })
          .eq("id", business.id);

        if (updateError) {
          console.error(
            `Error expiring premium for business ${business.id}:`,
            updateError,
          );
          continue;
        }

        // Create notification for the business owner
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: business.user_id,
            type: "premium_expired",
            title: "Premium Subscription Expired",
            message: `Your premium subscription for "${business.business_name}" has ended. Renew now to continue enjoying premium features and enhanced visibility.`,
            link: `/business-profiles/${business.id}/premium`,
            is_read: false,
          });

        if (notificationError) {
          console.error(
            `Error creating notification for business ${business.id}:`,
            notificationError,
          );
        }

        console.log(
          `Expired premium for business: ${business.business_name} (${business.id})`,
        );
        expiredCount++;
      }
    }

    // 2. Find businesses with premium expiring in 7 days and send renewal notifications
    const { data: expiringBusinesses, error: expiringError } = await supabase
      .from("business_profiles")
      .select("id, business_name, user_id, premium_tier, premium_expires_at")
      .eq("is_premium", true)
      .gte("premium_expires_at", nowISO)
      .lte("premium_expires_at", sevenDaysFromNowISO);

    let renewalNotificationCount = 0;

    if (
      !expiringError &&
      expiringBusinesses &&
      expiringBusinesses.length > 0
    ) {
      for (const business of expiringBusinesses) {
        // Check if we've already sent a renewal notification
        // (to avoid spamming if cron runs multiple times per day)
        const { data: existingNotification } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", business.user_id)
          .eq("type", "premium_expiring")
          .eq("link", `/business-profiles/${business.id}/premium`)
          .gte(
            "created_at",
            new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          )
          .maybeSingle();

        if (existingNotification) {
          console.log(
            `Renewal notification already sent for business ${business.id} in last 24 hours`,
          );
          continue;
        }

        // Calculate days until expiration
        const daysUntilExpiration = Math.ceil(
          (new Date(business.premium_expires_at!).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        // Create renewal notification
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: business.user_id,
            type: "premium_expiring",
            title: "Premium Subscription Expiring Soon",
            message: `Your premium subscription for "${business.business_name}" expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? "s" : ""}. Renew now to continue enjoying premium features.`,
            link: `/business-profiles/${business.id}/premium`,
            is_read: false,
          } as any);

        if (notificationError) {
          console.error(
            `Error creating renewal notification for business ${business.id}:`,
            notificationError,
          );
          continue;
        }

        console.log(
          `Sent renewal notification for business: ${business.business_name} (${business.id}) - expires in ${daysUntilExpiration} days`,
        );
        renewalNotificationCount++;
      }
    }

    return NextResponse.json({
      message: "Premium expiration check completed",
      expired_businesses: expiredCount,
      renewal_notifications_sent: renewalNotificationCount,
      timestamp: nowISO,
    });
  } catch (error) {
    console.error("Premium expiration cron error:", error);
    return NextResponse.json(
      { error: "Failed to process premium expirations" },
      { status: 500 },
    );
  }
}
