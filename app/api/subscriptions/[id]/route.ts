/**
 * PUT /api/subscriptions/:id
 * Handle subscription upgrade, downgrade, and cancel actions
 * Requirements: 16.9
 * Task: 37.4
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subscriptionService } from "@/lib/services/subscription";

export const dynamic = "force-dynamic";

/**
 * PUT /api/subscriptions/:id
 * Update subscription (upgrade/downgrade/cancel)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: subscriptionId } = await params;

    // Verify subscription belongs to user
    const { data: subscription, error: fetchError } = await (supabase as any)
      .from("subscriptions")
      .select("id, user_id")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: "Subscription not found or access denied" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { action, new_plan, reason } = body;

    // Validate action
    if (!action || !["upgrade", "downgrade", "cancel"].includes(action)) {
      return NextResponse.json(
        {
          error: "Invalid action. Must be 'upgrade', 'downgrade', or 'cancel'",
        },
        { status: 400 },
      );
    }

    let updatedSubscription;

    switch (action) {
      case "upgrade":
        if (!new_plan || !["pro", "business"].includes(new_plan)) {
          return NextResponse.json(
            { error: "Invalid upgrade plan. Must be 'pro' or 'business'" },
            { status: 400 },
          );
        }
        updatedSubscription = await subscriptionService.upgradeSubscription({
          user_id: user.id,
          new_plan,
        });
        break;

      case "downgrade":
        if (!new_plan || !["basic", "pro"].includes(new_plan)) {
          return NextResponse.json(
            { error: "Invalid downgrade plan. Must be 'basic' or 'pro'" },
            { status: 400 },
          );
        }
        updatedSubscription = await subscriptionService.downgradeSubscription({
          user_id: user.id,
          new_plan,
        });
        break;

      case "cancel":
        updatedSubscription = await subscriptionService.cancelSubscription({
          user_id: user.id,
          reason,
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error("Update subscription error:", error);
    return NextResponse.json(
      {
        error: "Failed to update subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
