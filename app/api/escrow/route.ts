/**
 * API Route: List Escrow Transactions
 *
 * GET /api/escrow
 * Lists escrow transactions for the authenticated user
 */

import { NextRequest, NextResponse } from "next/server";
import { escrowService } from "@/lib/services/escrow";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get("role") as "buyer" | "seller" | undefined;
    const status = searchParams.get("status") as any;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get transactions
    const transactions = await escrowService.getUserTransactions({
      user_id: user.id,
      role,
      status,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error("List escrow transactions error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch transactions",
      },
      { status: 500 },
    );
  }
}
