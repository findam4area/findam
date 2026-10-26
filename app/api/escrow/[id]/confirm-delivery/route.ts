/**
 * API Route: Confirm Delivery and Release Escrow
 * Requirements: 4.3, 4.10
 *
 * POST /api/escrow/:id/confirm-delivery
 * Confirms delivery and releases funds to seller wallet within 24 hours
 */

import { NextRequest, NextResponse } from "next/server";
import { escrowService } from "@/lib/services/escrow";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ConfirmDeliverySchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  review: z.string().max(1000).optional(),
});

export async function POST(
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

    // Await params to get the id
    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ConfirmDeliverySchema.parse(body);

    // Confirm delivery and release funds
    const result = await escrowService.confirmDelivery({
      escrow_transaction_id: id,
      buyer_id: user.id,
      rating: validatedData.rating,
      review: validatedData.review,
    });

    return NextResponse.json({
      success: true,
      escrow_transaction: result.escrow_transaction,
      released: result.released,
      message: "Delivery confirmed and funds released to seller",
    });
  } catch (error) {
    console.error("Confirm delivery error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to confirm delivery",
      },
      { status: 500 },
    );
  }
}
