/**
 * GET /api/cron/calculate-fraud-scores
 *
 * Cron job to periodically calculate fraud scores for all users.
 * Should be called daily via Vercel Cron or similar.
 *
 * Requirements: 24.1, 24.8, 24.10
 * Task: 26.2
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fraudDetectionEngine } from "@/lib/services/fraud-detection";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get all users who have been active in the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: activeUsers, error } = await supabase
      .from("users")
      .select("id")
      .or(
        `last_sign_in_at.gte.${ninetyDaysAgo.toISOString()},created_at.gte.${ninetyDaysAgo.toISOString()}`,
      )
      .limit(1000); // Process in batches

    if (error) {
      console.error("Error fetching active users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 },
      );
    }

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active users to process",
        processed: 0,
      });
    }

    // Calculate fraud scores for each user
    let processed = 0;
    let suspended = 0;
    const errors: string[] = [];

    for (const user of activeUsers) {
      try {
        const fraudScore = await fraudDetectionEngine.updateFraudScore(user.id);

        if (fraudScore) {
          processed++;

          // Check if account was suspended
          if (fraudScore.is_suspended) {
            suspended++;
          }
        }
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        errors.push(user.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Fraud scores calculated successfully",
      processed,
      suspended,
      errors: errors.length,
      errorUserIds: errors.slice(0, 10), // Return first 10 errors
    });
  } catch (error) {
    console.error("Error in fraud score calculation cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
