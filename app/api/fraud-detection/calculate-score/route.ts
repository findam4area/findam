/**
 * POST /api/fraud-detection/calculate-score
 *
 * Calculate or update fraud score for a user.
 * Requires admin authentication.
 *
 * Requirements: 24.1, 24.8
 * Task: 26.2
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

    // Parse request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 },
      );
    }

    // Calculate and update fraud score
    const fraudScore = await fraudDetectionEngine.updateFraudScore(userId);

    if (!fraudScore) {
      return NextResponse.json(
        { error: "Failed to calculate fraud score" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      fraudScore: fraudScore.fraud_score,
      riskLevel: fraudScore.risk_level,
      factors: fraudScore.factors,
      metrics: fraudScore.metrics,
      isSuspended: fraudScore.is_suspended,
      suspensionReason: fraudScore.suspension_reason,
    });
  } catch (error) {
    console.error("Error calculating fraud score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
