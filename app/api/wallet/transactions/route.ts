/**
 * API Route: Get Wallet Transactions
 * Requirements: 5.7
 *
 * GET /api/wallet/transactions
 * Returns paginated transaction history with optional category filter
 */

import { NextRequest, NextResponse } from "next/server";
import { walletService } from "@/lib/services/wallet";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const TransactionQuerySchema = z.object({
  category: z
    .enum([
      "escrow_release",
      "withdrawal",
      "refund",
      "purchase",
      "fee",
      "adjustment",
      "referral",
      "bonus",
    ])
    .optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      category: searchParams.get("category") || undefined,
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    };

    const validatedParams = TransactionQuerySchema.parse(queryParams);

    // Get transactions
    const transactions = await walletService.getTransactions({
      user_id: user.id,
      category: validatedParams.category as any,
      limit: validatedParams.limit,
      offset: validatedParams.offset,
    });

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        count: transactions.length,
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 },
      );
    }

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
