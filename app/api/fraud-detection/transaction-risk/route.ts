/**
 * POST /api/fraud-detection/transaction-risk
 *
 * Generate risk score for a transaction between buyer and seller.
 * Used before processing escrow payments.
 *
 * Requirements: 24.8
 * Task: 26.2
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fraudDetectionEngine } from "@/lib/services/fraud-detection";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { buyerId, sellerId, itemValue } = body;

    if (!buyerId || !sellerId || itemValue === undefined) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // Validate that user is either buyer or seller
    if (user.id !== buyerId && user.id !== sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate transaction risk score
    const riskAssessment =
      await fraudDetectionEngine.generateTransactionRiskScore(
        buyerId,
        sellerId,
        itemValue,
      );

    return NextResponse.json({
      success: true,
      riskScore: riskAssessment.riskScore,
      riskLevel: riskAssessment.riskLevel,
      factors: riskAssessment.factors,
    });
  } catch (error) {
    console.error("Error generating transaction risk score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
