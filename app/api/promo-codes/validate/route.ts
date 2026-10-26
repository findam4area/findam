/**
 * Promo Code Validation API Route
 * Validates promo codes for subscription discounts
 * Requirements: 24.8
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subscriptionService } from "@/lib/services/subscription";

/**
 * POST /api/promo-codes/validate
 * Validate a promo code for a specific plan
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, plan } = body;

    // Validate required fields
    if (!code || !plan) {
      return NextResponse.json(
        { error: "Missing required fields: code, plan" },
        { status: 400 }
      );
    }

    // Validate plan
    if (!["pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'pro' or 'enterprise'" },
        { status: 400 }
      );
    }

    // Validate promo code
    const validation = await subscriptionService.validatePromoCode(code, user.id, plan);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid promo code" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      promo_code: validation.promo,
      discount_amount: validation.discount,
      message: `Promo code applied! You'll save ₦${validation.discount?.toFixed(2)}`,
    });
  } catch (error) {
    console.error("Promo code validation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to validate promo code" },
      { status: 500 }
    );
  }
}
