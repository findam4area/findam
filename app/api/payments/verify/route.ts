import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { paystackClient } from "@/lib/paystack/client";
import { z } from "zod";

const verifyPaymentSchema = z.object({
  reference: z.string(),
});

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

    // Parse and validate request body
    const body = await request.json();
    const validated = verifyPaymentSchema.parse(body);

    // Verify transaction with Paystack
    const paystackResponse = await paystackClient.verifyTransaction(
      validated.reference,
    );

    if (!paystackResponse.status) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 },
      );
    }

    const { data: transactionData } = paystackResponse;

    // Check if payment was successful
    if (transactionData.status !== "success") {
      // Update payment record as failed
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("paystack_reference", validated.reference);

      return NextResponse.json(
        { error: "Payment was not successful", status: transactionData.status },
        { status: 400 },
      );
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("paystack_reference", validated.reference)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 },
      );
    }

    // Check if payment already processed
    if (payment.status === "success") {
      return NextResponse.json({
        message: "Payment already processed",
        payment_type: payment.payment_type,
      });
    }

    // Update payment record
    await supabase
      .from("payments")
      .update({ status: "success" })
      .eq("paystack_reference", validated.reference);

    // Process payment based on type
    if (payment.payment_type === "boost" && payment.listing_id) {
      // Boost listing for 7 days
      const boostExpiresAt = new Date();
      boostExpiresAt.setDate(boostExpiresAt.getDate() + 7);

      await supabase
        .from("listings")
        .update({
          is_boosted: true,
          boost_expires_at: boostExpiresAt.toISOString(),
        })
        .eq("id", payment.listing_id);
    } else if (payment.payment_type === "premium") {
      // Activate premium subscription for 30 days
      const premiumExpiresAt = new Date();
      premiumExpiresAt.setDate(premiumExpiresAt.getDate() + 30);

      await supabase
        .from("users")
        .update({
          is_premium: true,
          premium_expires_at: premiumExpiresAt.toISOString(),
        })
        .eq("id", payment.user_id ?? "");
    }

    return NextResponse.json({
      message: "Payment verified successfully",
      payment_type: payment.payment_type,
      amount: payment.amount,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 },
    );
  }
}
