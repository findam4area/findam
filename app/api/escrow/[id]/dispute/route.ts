/**
 * API Route: Dispute Escrow Transaction
 * Requirements: 4.5
 *
 * POST /api/escrow/:id/dispute
 * Disputes a transaction and freezes funds with 'disputed' status
 */

import { NextRequest, NextResponse } from "next/server";
import { escrowService } from "@/lib/services/escrow";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const DisputeEscrowSchema = z.object({
  reason: z.string().min(10).max(1000),
  evidence: z.record(z.any()).optional(),
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
    const validatedData = DisputeEscrowSchema.parse(body);

    // Dispute transaction
    const escrowTransaction = await escrowService.disputeTransaction({
      escrow_transaction_id: id,
      buyer_id: user.id,
      reason: validatedData.reason,
      evidence: validatedData.evidence,
    });

    return NextResponse.json({
      success: true,
      escrow_transaction: escrowTransaction,
      message:
        "Transaction disputed successfully. Funds are frozen pending resolution.",
    });
  } catch (error) {
    console.error("Dispute transaction error:", error);

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
            : "Failed to dispute transaction",
      },
      { status: 500 },
    );
  }
}
