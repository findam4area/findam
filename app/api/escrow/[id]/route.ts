/**
 * API Route: Get Escrow Transaction
 *
 * GET /api/escrow/:id
 * Retrieves escrow transaction details
 */

import { NextRequest, NextResponse } from "next/server";
import { escrowService } from "@/lib/services/escrow";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
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

    // Get transaction
    const transaction = await escrowService.getTransaction(id);

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Verify user is buyer or seller
    if (transaction.buyer_id !== user.id && transaction.seller_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      escrow_transaction: transaction,
    });
  } catch (error) {
    console.error("Get escrow transaction error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch transaction",
      },
      { status: 500 },
    );
  }
}
