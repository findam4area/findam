import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/business-profiles/[id]/premium
 * 
 * Upgrade a business profile to premium status
 * 
 * Task 11.2: Create POST /api/business-profiles/[id]/premium endpoint
 * Requirements: 15.1, 15.5, 15.6
 * 
 * @body UpgradeToPremiumRequest
 * {
 *   tier: 'basic' | 'pro' | 'enterprise' - Premium tier selection
 *   duration_months: 1 | 3 | 6 | 12 - Subscription duration
 *   payment_method: string - Payment method identifier
 * }
 * 
 * @returns Payment URL and subscription details
 * 
 * Features:
 * - Verifies requesting user owns the business profile
 * - Calculates premium expiration date based on duration
 * - Sets is_premium = true, premium_tier, premium_expires_at
 * - Generates payment URL (integration with payment provider)
 * - Returns payment URL and subscription ID
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to upgrade to premium." },
        { status: 401 },
      );
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid business profile ID format" },
        { status: 400 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { tier, duration_months, payment_method } = body;

    // Validate required fields
    if (!tier || !duration_months || !payment_method) {
      return NextResponse.json(
        { error: "tier, duration_months, and payment_method are required" },
        { status: 400 },
      );
    }

    // Validate tier
    const validTiers = ["basic", "pro", "enterprise"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: "tier must be one of: basic, pro, enterprise" },
        { status: 400 },
      );
    }

    // Validate duration_months
    const validDurations = [1, 3, 6, 12];
    if (!validDurations.includes(duration_months)) {
      return NextResponse.json(
        { error: "duration_months must be one of: 1, 3, 6, 12" },
        { status: 400 },
      );
    }

    // Check if business profile exists and belongs to the user
    const { data: existingProfile, error: fetchError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingProfile) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 },
      );
    }

    if (existingProfile.user_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Forbidden. You can only upgrade your own business profile to premium.",
        },
        { status: 403 },
      );
    }

    // Check if already premium (and not expired)
    if (
      existingProfile.is_premium &&
      existingProfile.premium_expires_at &&
      new Date(existingProfile.premium_expires_at) > new Date()
    ) {
      return NextResponse.json(
        {
          error: "Business profile already has an active premium subscription",
          expires_at: existingProfile.premium_expires_at,
        },
        { status: 400 },
      );
    }

    // Calculate premium expiration date
    const now = new Date();
    const expirationDate = new Date(now);
    expirationDate.setMonth(expirationDate.getMonth() + duration_months);

    // Generate subscription ID (in production, this would come from payment provider)
    const subscription_id = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Update business profile with premium status
    // Note: In production, this would only happen after successful payment confirmation
    const { data: premiumProfile, error: updateError } = await supabase
      .from("business_profiles")
      .update({
        is_premium: true,
        premium_tier: tier,
        premium_expires_at: expirationDate.toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error upgrading business profile to premium:", updateError);
      return NextResponse.json(
        { error: "Failed to upgrade business profile to premium" },
        { status: 500 },
      );
    }

    // Generate payment URL (in production, integrate with Stripe, Paystack, or other payment provider)
    // This is a placeholder implementation
    const payment_url = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payments/premium?subscription_id=${subscription_id}&tier=${tier}&duration=${duration_months}&business_id=${id}`;

    return NextResponse.json(
      {
        success: true,
        payment_url,
        subscription_id,
        business_profile: premiumProfile,
        message:
          "Premium upgrade initiated. Complete payment to activate premium features.",
        expires_at: expirationDate.toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in premium upgrade endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
