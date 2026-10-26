/**
 * Promo Code Validation API
 * Validates and applies promo codes to subscriptions
 * Requirements: 24.8
 * Task: 20.2
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subscriptionService } from "@/lib/services/subscription";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscription/promo-code
 * Validate a promo code
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { code, plan } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 },
      );
    }

    if (!plan || !["pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Valid plan is required" },
        { status: 400 },
      );
    }

    // Validate promo code
    const validation = await subscriptionService.validatePromoCode(
      code.toUpperCase(),
      user.id,
      plan,
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid promo code" },
        { status: 400 },
      );
    }

    // Return validation result with discount details
    return NextResponse.json({
      valid: true,
      promo_code: {
        id: validation.promo?.id,
        code: validation.promo?.code,
        description: validation.promo?.description,
        discount_type: validation.promo?.discount_type,
        discount_value: validation.promo?.discount_value,
        duration_months: validation.promo?.duration_months,
      },
      discount: validation.discount,
    });
  } catch (error) {
    console.error("Promo code validation error:", error);
    return NextResponse.json(
      {
        error: "Failed to validate promo code",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
