import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  verifyPaystackSignature,
  PaystackWebhookPayload,
} from "@/lib/paystack/webhook";

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = verifyPaystackSignature(rawBody, signature);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse webhook payload
    const payload: PaystackWebhookPayload = JSON.parse(rawBody);

    const supabase = await createClient();

    // Handle different event types
    switch (payload.event) {
      case "charge.success":
        await handleChargeSuccess(supabase, payload);
        break;

      case "charge.failed":
        await handleChargeFailed(supabase, payload);
        break;

      case "subscription.disable":
      case "subscription.not_renew":
        await handleSubscriptionDisabled(supabase, payload);
        break;

      default:
        console.log("Unhandled webhook event:", payload.event);
    }

    return NextResponse.json({ message: "Webhook processed" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}

async function handleChargeSuccess(
  supabase: any,
  payload: PaystackWebhookPayload,
) {
  const { reference, metadata } = payload.data;

  // Get payment record
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("*")
    .eq("paystack_reference", reference)
    .single();

  if (paymentError || !payment) {
    console.error("Payment record not found:", reference);
    return;
  }

  // Skip if already processed
  if (payment.status === "success") {
    return;
  }

  // Update payment status
  await supabase
    .from("payments")
    .update({ status: "success" })
    .eq("paystack_reference", reference);

  // Process based on payment type
  if (payment.payment_type === "boost" && payment.listing_id) {
    const boostExpiresAt = new Date();
    boostExpiresAt.setDate(boostExpiresAt.getDate() + 7);

    await supabase
      .from("listings")
      .update({
        is_boosted: true,
        boost_expires_at: boostExpiresAt.toISOString(),
      })
      .eq("id", payment.listing_id);

    // Create notification
    await supabase.from("notifications").insert({
      user_id: payment.user_id,
      type: "boost_activated",
      title: "Listing Boosted!",
      message: "Your listing is now boosted for 7 days",
      link: `/listing/${payment.listing_id}`,
    });
  } else if (payment.payment_type === "premium") {
    const premiumExpiresAt = new Date();
    premiumExpiresAt.setDate(premiumExpiresAt.getDate() + 30);

    await supabase
      .from("users")
      .update({
        is_premium: true,
        premium_expires_at: premiumExpiresAt.toISOString(),
      })
      .eq("id", payment.user_id);

    // Create notification
    await supabase.from("notifications").insert({
      user_id: payment.user_id,
      type: "premium_activated",
      title: "Premium Activated!",
      message: "Welcome to FindAm Premium! Enjoy 30 listings and analytics.",
      link: "/profile",
    });
  }
}

async function handleChargeFailed(
  supabase: any,
  payload: PaystackWebhookPayload,
) {
  const { reference } = payload.data;

  await supabase
    .from("payments")
    .update({ status: "failed" })
    .eq("paystack_reference", reference);
}

async function handleSubscriptionDisabled(
  supabase: any,
  payload: PaystackWebhookPayload,
) {
  const { metadata } = payload.data;
  const userId = metadata?.user_id;

  if (userId) {
    await supabase
      .from("users")
      .update({
        is_premium: false,
        premium_expires_at: null,
      })
      .eq("id", userId);

    // Create notification
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "premium_expired",
      title: "Premium Expired",
      message:
        "Your premium subscription has ended. Renew to continue enjoying premium features.",
      link: "/premium",
    });
  }
}
