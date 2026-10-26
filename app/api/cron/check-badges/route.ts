import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VerificationService } from "@/lib/services/verification";

/**
 * Cron job to check and update verification badges
 * Requirements: 15.2, 15.4, 15.5, 15.7
 * Tasks: 28.2, 28.4
 *
 * This job:
 * - Checks badge criteria for all users with badges
 * - Awards higher tier badges when criteria are met
 * - Revokes badges when rating drops below threshold
 *
 * Should be called periodically (e.g., daily) by a scheduler like Vercel Cron
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

    // Get all users with verification badges (or who might be eligible)
    const { data: badges, error: badgesError } = await supabase
      .from("verification_badges")
      .select("user_id, tier")
      .order("last_checked_at", { ascending: true })
      .limit(100); // Process in batches

    if (badgesError) {
      console.error("Error fetching badges:", badgesError);
      return NextResponse.json(
        { error: "Failed to fetch badges" },
        { status: 500 },
      );
    }

    let upgraded = 0;
    let revoked = 0;
    let unchanged = 0;

    for (const badge of badges || []) {
      try {
        // Check badge criteria
        const result = await VerificationService.checkBadgeCriteria(
          badge.user_id,
        );

        if (!result) {
          console.error(`Failed to check criteria for user ${badge.user_id}`);
          continue;
        }

        if (result.shouldUpdate) {
          if (result.eligibleTier === "none") {
            // Revoke badge
            await VerificationService.revokeBadge(badge.user_id, result.reason);
            revoked++;
            console.log(
              `Revoked badge for user ${badge.user_id}: ${result.reason}`,
            );
          } else {
            // Award higher tier badge
            await VerificationService.awardBadge(
              badge.user_id,
              result.eligibleTier,
              result.reason,
            );
            upgraded++;
            console.log(
              `Upgraded user ${badge.user_id} to ${result.eligibleTier}: ${result.reason}`,
            );
          }
        } else {
          unchanged++;
        }
      } catch (error) {
        console.error(
          `Error processing badge for user ${badge.user_id}:`,
          error,
        );
      }
    }

    return NextResponse.json({
      message: "Badge check completed",
      processed: badges?.length || 0,
      upgraded,
      revoked,
      unchanged,
    });
  } catch (error) {
    console.error("Badge check cron error:", error);
    return NextResponse.json(
      { error: "Failed to check badges" },
      { status: 500 },
    );
  }
}
