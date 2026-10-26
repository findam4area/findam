/**
 * GET /api/fraud-detection/user-alert?userId=xxx
 *
 * Get fraud alert for a user when interacting with them.
 * Returns warning message if user is flagged.
 *
 * Requirements: 24.9
 * Task: 26.11
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fraudDetectionEngine } from "@/lib/services/fraud-detection";

export async function GET(request: NextRequest) {
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

    // Get userId from query params
    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 },
      );
    }

    // Get fraud alert for user
    const alert = await fraudDetectionEngine.getFraudAlertForUser(targetUserId);

    return NextResponse.json({
      success: true,
      hasAlert: alert !== null,
      alertMessage: alert,
    });
  } catch (error) {
    console.error("Error getting fraud alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
