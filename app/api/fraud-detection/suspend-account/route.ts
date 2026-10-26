/**
 * POST /api/fraud-detection/suspend-account
 *
 * Manually suspend a high-risk account.
 * Requires admin authentication.
 *
 * Requirements: 24.4
 * Task: 26.5
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fraudDetectionEngine } from "@/lib/services/fraud-detection";
import { requireAdmin } from "@/lib/auth/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin authentication
    const authError = await requireAdmin(supabase);
    if (authError) return authError;

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { userId, reason } = body;

    if (!userId || !reason) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // Get current fraud score
    const fraudScore = await fraudDetectionEngine.getFraudScore(userId);

    if (!fraudScore) {
      return NextResponse.json(
        { error: "Fraud score not found for user" },
        { status: 404 },
      );
    }

    // Suspend account
    const success = await fraudDetectionEngine.suspendHighRiskAccount(
      userId,
      fraudScore.fraud_score,
      reason,
      user.id,
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to suspend account" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account suspended successfully",
    });
  } catch (error) {
    console.error("Error suspending account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
