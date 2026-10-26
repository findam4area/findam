import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { paystackClient } from "@/lib/paystack/client";
import { z } from "zod";

const initializePaymentSchema = z.object({
  payment_type: z.enum(["boost", "premium"]),
  listing_id: z.string().uuid().optional(),
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
    const validated = initializePaymentSchema.parse(body);

    // Determine amount based on payment type
    const amount =
      validated.payment_type === "boost"
        ? 50000 // ₦500 in kobo
        : 599900; // ₦5,999 in kobo

    // Generate unique reference
    const reference = `${validated.payment_type}_${user.id}_${Date.now()}`;

    // Get user email
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create payment record
    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: user.id,
      listing_id: validated.listing_id || null,
      amount: amount / 100, // Convert kobo to naira
      currency: "NGN",
      payment_type: validated.payment_type,
      paystack_reference: reference,
      status: "pending",
    });

    if (paymentError) {
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 },
      );
    }

    // Initialize Paystack transaction
    const paystackResponse = await paystackClient.initializeTransaction({
      email: userData.email,
      amount,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/callback`,
      metadata: {
        user_id: user.id,
        payment_type: validated.payment_type,
        listing_id: validated.listing_id || null,
      },
    });

    return NextResponse.json({
      authorization_url: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference,
    });
  } catch (error) {
    console.error("Payment initialization error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 },
    );
  }
}
