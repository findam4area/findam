/**
 * Subscription Downgrade API
 * Handles subscription downgrades with prorated refunds
 * Requirements: 24.9
 * Task: 20.2
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subscriptionService } from "@/lib/services/subscription";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscription/downgrade
 * Downgrade subscription with prorated refund
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
    const { new_plan, apply_refund = true } = body;

    if (!new_plan || !["basic", "pro"].includes(new_plan)) {
      return NextResponse.json(
        { error: "Valid new plan is required (basic or pro)" },
        { status: 400 },
      );
    }

    // Get current subscription
    const currentSubscription =
      await subscriptionService.getSubscription(user.id);

    if (!currentSubscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 },
      );
    }

    // Validate downgrade path
    if (currentSubscription.plan === "basic") {
      return NextResponse.json(
        { error: "Already on Basic plan" },
        { status: 400 },
      );
    }

    if (currentSubscription.plan === "pro" && new_plan === "pro") {
      return NextResponse.json(
        { error: "Already on Pro plan" },
        { status: 400 },
      );
    }

    if ((currentSubscription.plan as string) === "basic" && new_plan === "pro") {
      return NextResponse.json(
        { error: "This is an upgrade, not a downgrade. Use upgrade endpoint" },
        { status: 400 },
      );
    }

    // Calculate prorated refund
    const refundAmount = apply_refund
      ? await subscriptionService.calculateProratedRefund(user.id, new_plan)
      : 0;

    // Perform downgrade
    const result = await subscriptionService.downgradeSubscription({
      user_id: user.id,
      new_plan,
      apply_refund,
    });

    // Send notification
    await (supabase as any).from("notifications").insert({
      user_id: user.id,
      type: "subscription_downgraded",
      title: "Subscription Downgraded",
      message: refundAmount > 0
        ? `Your subscription has been downgraded to ${new_plan}. A prorated refund of ₦${refundAmount.toFixed(2)} has been credited to your wallet.`
        : `Your subscription has been downgraded to ${new_plan}. The changes will take effect at the end of your current billing period.`,
      link: "/premium",
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      refund_amount: result.refund_amount,
      message:
        refundAmount > 0
          ? `Downgraded to ${new_plan}. Refund of ₦${refundAmount.toFixed(2)} credited to your wallet.`
          : `Downgraded to ${new_plan}. Changes will take effect at the end of your billing period.`,
    });
  } catch (error) {
    console.error("Subscription downgrade error:", error);
    return NextResponse.json(
      {
        error: "Failed to downgrade subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/subscription/downgrade
 * Calculate prorated refund for potential downgrade
 */
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const new_plan = searchParams.get("new_plan");

    if (!new_plan || !["basic", "pro"].includes(new_plan)) {
      return NextResponse.json(
        { error: "Valid new_plan parameter is required (basic or pro)" },
        { status: 400 },
      );
    }

    // Calculate refund
    const refundAmount = await subscriptionService.calculateProratedRefund(
      user.id,
      new_plan as "basic" | "pro",
    );

    // Get current subscription for context
    const currentSubscription =
      await subscriptionService.getSubscription(user.id);

    return NextResponse.json({
      current_plan: currentSubscription?.plan,
      new_plan,
      refund_amount: refundAmount,
      message:
        refundAmount > 0
          ? `You will receive a prorated refund of ₦${refundAmount.toFixed(2)} credited to your wallet.`
          : "No refund will be issued for this downgrade.",
    });
  } catch (error) {
    console.error("Refund calculation error:", error);
    return NextResponse.json(
      {
        error: "Failed to calculate refund",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
