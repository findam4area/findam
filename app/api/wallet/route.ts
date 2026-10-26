/**
 * API Route: Get Wallet Balance
 * Requirements: 5.1, 5.7
 *
 * GET /api/wallet
 * Returns wallet balance and recent transactions
 */

import { NextRequest, NextResponse } from "next/server";
import { walletService } from "@/lib/services/wallet";
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

    // Get wallet balance
    const wallet = await walletService.getBalance(user.id);

    // Get recent transactions (last 10)
    const recentTransactions = await walletService.getTransactions({
      user_id: user.id,
      limit: 10,
      offset: 0,
    });

    return NextResponse.json({
      success: true,
      wallet,
      recent_transactions: recentTransactions,
    });
  } catch (error) {
    console.error("Get wallet error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch wallet",
      },
      { status: 500 },
    );
  }
}
