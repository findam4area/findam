/**
 * Subscription API Routes
 * Handles subscription creation, retrieval, and management
 * Requirements: 16.1, 16.7, 16.9, 16.10
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subscriptionService } from "@/lib/services/subscription";

export const dynamic = "force-dynamic";

/**
 * GET /api/subscription
 * Get current user's subscription
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

    // Get subscription
    const subscription = await subscriptionService.getSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/subscription
 * Create a new subscription
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

    const body = await request.json();
    const { plan, callback_url } = body;

    // Validate plan
    if (!plan || !["pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'pro' or 'enterprise'" },
        { status: 400 },
      );
    }

    // Create subscription
    const result = await subscriptionService.createSubscription({
      user_id: user.id,
      email: user.email!,
      plan,
      callback_url,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Create subscription error:", error);
    return NextResponse.json(
      {
        error: "Failed to create subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/subscription
 * Update subscription (upgrade/downgrade)
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { action, new_plan } = body;

    // Validate action
    if (!action || !["upgrade", "downgrade"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'upgrade' or 'downgrade'" },
        { status: 400 },
      );
    }

    // Validate new plan
    if (!new_plan) {
      return NextResponse.json(
        { error: "new_plan is required" },
        { status: 400 },
      );
    }

    let subscription;
    if (action === "upgrade") {
      if (!["pro", "enterprise"].includes(new_plan)) {
        return NextResponse.json(
          { error: "Invalid upgrade plan. Must be 'pro' or 'enterprise'" },
          { status: 400 },
        );
      }
      subscription = await subscriptionService.upgradeSubscription({
        user_id: user.id,
        new_plan,
      });
    } else {
      if (!["basic", "pro"].includes(new_plan)) {
        return NextResponse.json(
          { error: "Invalid downgrade plan. Must be 'basic' or 'pro'" },
          { status: 400 },
        );
      }
      subscription = await subscriptionService.downgradeSubscription({
        user_id: user.id,
        new_plan,
      });
    }

    return NextResponse.json({ subscription });
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

/**
 * DELETE /api/subscription
 * Cancel subscription
 */
export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const { reason } = body;

    // Cancel subscription
    const subscription = await subscriptionService.cancelSubscription({
      user_id: user.id,
      reason,
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
