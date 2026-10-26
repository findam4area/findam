/**
 * API Route: Initialize Escrow Payment
 * Requirements: 4.1, 4.9
 *
 * POST /api/escrow/initialize
 * Creates an escrow transaction and returns Paystack payment URL
 */

import { NextRequest, NextResponse } from "next/server";
import { escrowService } from "@/lib/services/escrow";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const InitializeEscrowSchema = z.object({
  listing_id: z.string().uuid(),
  seller_id: z.string().uuid(),
  amount: z.number().positive(),
  estimated_delivery_date: z.string().optional(),
  callback_url: z.string().url().optional(),
});

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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = InitializeEscrowSchema.parse(body);

    // Get user email
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 },
      );
    }

    // Verify listing exists and is active
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, user_id, price, is_active")
      .eq("id", validatedData.listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (!listing.is_active) {
      return NextResponse.json(
        { error: "Listing is not available for purchase" },
        { status: 400 },
      );
    }

    // Verify seller_id matches listing
    if (listing.user_id !== validatedData.seller_id) {
      return NextResponse.json({ error: "Invalid seller ID" }, { status: 400 });
    }

    // Initialize escrow
    const result = await escrowService.initializeEscrow({
      listing_id: validatedData.listing_id,
      buyer_id: user.id,
      seller_id: validatedData.seller_id,
      amount: validatedData.amount,
      buyer_email: userData.email,
      estimated_delivery_date: validatedData.estimated_delivery_date,
      callback_url: validatedData.callback_url,
    });

    return NextResponse.json({
      success: true,
      escrow_transaction_id: result.escrow_transaction.id,
      payment_url: result.payment_url,
      reference: result.reference,
    });
  } catch (error) {
    console.error("Initialize escrow error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize escrow",
      },
      { status: 500 },
    );
  }
}
