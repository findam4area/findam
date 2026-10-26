/**
 * Paystack Subscription Webhook Handler
 * Handles subscription events from Paystack
 * Requirements: 16.7, 16.8
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Verify Paystack webhook signature
 */
function verifyPaystackSignature(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
    .update(payload)
    .digest("hex");
  return hash === signature;
}

/**
 * POST /api/webhooks/paystack-subscription
 * Handle Paystack subscription webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-paystack-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const payload = await request.text();

    // Verify signature
    if (!verifyPaystackSignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(payload);
    const supabase = await createClient();

    // Handle different event types
    switch (event.event) {
      case "subscription.create":
        // Subscription created successfully
        await handleSubscriptionCreate(supabase, event.data);
        break;

      case "subscription.disable":
        // Subscription disabled (cancelled or expired)
        await handleSubscriptionDisable(supabase, event.data);
        break;

      case "subscription.enable":
        // Subscription re-enabled
        await handleSubscriptionEnable(supabase, event.data);
        break;

      case "invoice.create":
      case "invoice.update":
        // Invoice created or updated
        await handleInvoice(supabase, event.data);
        break;

      case "invoice.payment_failed":
        // Payment failed
        await handlePaymentFailed(supabase, event.data);
        break;

      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack subscription webhook error:", error);
    return NextResponse.json(
      {
        error: "Webhook processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function handleSubscriptionCreate(supabase: any, data: any) {
  const subscriptionCode = data.subscription_code;

  // Get subscription details
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("user_id, plan, current_period_end")
    .eq("paystack_subscription_code", subscriptionCode)
    .single();

  if (subscription) {
    // Update subscription status
    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        paystack_subscription_code: subscriptionCode,
      })
      .eq("paystack_subscription_code", subscriptionCode);

    // Activate premium features on user profile
    await supabase
      .from("users")
      .update({
        is_premium: true,
        premium_tier: subscription.plan,
        premium_expires_at: subscription.current_period_end,
      })
      .eq("id", subscription.user_id);
  }
}

async function handleSubscriptionDisable(supabase: any, data: any) {
  const subscriptionCode = data.subscription_code;

  // Get subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("paystack_subscription_code", subscriptionCode)
    .single();

  if (subscription) {
    // Mark as expired
    await supabase
      .from("subscriptions")
      .update({
        status: "expired",
      })
      .eq("paystack_subscription_code", subscriptionCode);

    // Revoke premium features on user profile
    await supabase
      .from("users")
      .update({
        is_premium: false,
        premium_tier: "basic",
        premium_expires_at: null,
      })
      .eq("id", subscription.user_id);

    // Send notification
    await supabase.from("notifications").insert({
      user_id: subscription.user_id,
      type: "subscription_disabled",
      title: "Subscription Disabled",
      message:
        "Your subscription has been disabled. Please update your payment method to continue enjoying premium features.",
      link: "/premium",
      is_read: false,
    });
  }
}

async function handleSubscriptionEnable(supabase: any, data: any) {
  const subscriptionCode = data.subscription_code;

  // Get subscription details
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("user_id, plan, current_period_end")
    .eq("paystack_subscription_code", subscriptionCode)
    .single();

  if (subscription) {
    // Update subscription status
    await supabase
      .from("subscriptions")
      .update({
        status: "active",
      })
      .eq("paystack_subscription_code", subscriptionCode);

    // Re-activate premium features on user profile
    await supabase
      .from("users")
      .update({
        is_premium: true,
        premium_tier: subscription.plan,
        premium_expires_at: subscription.current_period_end,
      })
      .eq("id", subscription.user_id);
  }
}

async function handleInvoice(supabase: any, data: any) {
  const subscriptionCode = data.subscription?.subscription_code;
  if (!subscriptionCode) return;

  // Update billing dates
  const now = new Date();
  const nextBilling = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await supabase
    .from("subscriptions")
    .update({
      last_billing_date: now.toISOString(),
      next_billing_date: nextBilling.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: nextBilling.toISOString(),
    })
    .eq("paystack_subscription_code", subscriptionCode);
}

async function handlePaymentFailed(supabase: any, data: any) {
  const subscriptionCode = data.subscription?.subscription_code;
  if (!subscriptionCode) return;

  // Get subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("paystack_subscription_code", subscriptionCode)
    .single();

  if (subscription) {
    // Send notification
    await supabase.from("notifications").insert({
      user_id: subscription.user_id,
      type: "payment_failed",
      title: "Payment Failed",
      message:
        "Your subscription payment failed. Please update your payment method to avoid service interruption.",
      link: "/premium",
      is_read: false,
    });
  }
}
