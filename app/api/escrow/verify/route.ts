/**
 * API Route: Verify Escrow Payment
 * Requirements: 4.1, 4.2
 * 
 * POST /api/escrow/verify
 * Verifies Paystack payment and updates escrow status to 'held'
 */

import { NextRequest, NextResponse } from "next/server";
import { escrowService } from "@/lib/services/escrow";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const VerifyEscrowSchema = z.object({
  reference: z.string(),
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = VerifyEscrowSchema.parse(body);

    // Confirm payment and update escrow status
    const escrowTransaction = await escrowService.confirmPayment({
      reference: validatedData.reference,
    });

    return NextResponse.json({
      success: true,
      escrow_transaction: escrowTransaction,
    });
  } catch (error) {
    console.error("Verify escrow error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to verify payment",
      },
      { status: 500 }
    );
  }
}
