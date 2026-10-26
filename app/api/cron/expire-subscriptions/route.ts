import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Cron job to handle expired premium subscriptions and listing boosts
 * This should be called periodically (e.g., daily) by a scheduler like Vercel Cron
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
    const now = new Date().toISOString();

    // Expire premium subscriptions
    const { data: expiredPremiumUsers, error: premiumError } = await supabase
      .from("users")
      .select("id, email, username")
      .eq("is_premium", true)
      .lt("premium_expires_at", now);

    if (!premiumError && expiredPremiumUsers) {
      for (const user of expiredPremiumUsers) {
        // Downgrade to free tier
        await supabase
          .from("users")
          .update({
            is_premium: false,
            premium_expires_at: null,
          })
          .eq("id", user.id);

        // Create notification
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "premium_expired",
          title: "Premium Expired",
          message:
            "Your premium subscription has ended. Renew to continue enjoying premium features.",
          link: "/premium",
        });

        console.log(`Expired premium for user: ${user.username}`);
      }
    }

    // Expire listing boosts
    const { data: expiredBoosts, error: boostError } = await supabase
      .from("listings")
      .select("id, title, user_id")
      .eq("is_boosted", true)
      .lt("boost_expires_at", now);

    if (!boostError && expiredBoosts) {
      for (const listing of expiredBoosts) {
        // Remove boost
        await supabase
          .from("listings")
          .update({
            is_boosted: false,
            boost_expires_at: null,
          })
          .eq("id", listing.id);

        // Create notification
        await supabase.from("notifications").insert({
          user_id: listing.user_id,
          type: "boost_expired",
          title: "Boost Expired",
          message: `Your boost for "${listing.title}" has ended. Boost again to increase visibility.`,
          link: `/listing/${listing.id}`,
        });

        console.log(`Expired boost for listing: ${listing.title}`);
      }
    }

    return NextResponse.json({
      message: "Expiration check completed",
      expired_premium_users: expiredPremiumUsers?.length || 0,
      expired_boosts: expiredBoosts?.length || 0,
    });
  } catch (error) {
    console.error("Expiration cron error:", error);
    return NextResponse.json(
      { error: "Failed to process expirations" },
      { status: 500 },
    );
  }
}
