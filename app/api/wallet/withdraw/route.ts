/**
 * API Route: Request Withdrawal
 * Requirements: 5.3
 *
 * POST /api/wallet/withdraw
 * Creates a withdrawal request to bank account
 */

import { NextRequest, NextResponse } from "next/server";
import { walletService } from "@/lib/services/wallet";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const WithdrawalRequestSchema = z.object({
  amount: z.number().positive().min(100, "Minimum withdrawal amount is ₦100"),
  bank_code: z.string().min(1, "Bank code is required"),
  account_number: z
    .string()
    .length(10, "Account number must be 10 digits")
    .regex(/^\d+$/, "Account number must contain only digits"),
  account_name: z.string().min(1, "Account name is required"),
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
    const validatedData = WithdrawalRequestSchema.parse(body);

    // Request withdrawal
    const withdrawal = await walletService.requestWithdrawal({
      user_id: user.id,
      amount: validatedData.amount,
      bank_code: validatedData.bank_code,
      account_number: validatedData.account_number,
      account_name: validatedData.account_name,
    });

    return NextResponse.json({
      success: true,
      withdrawal,
      message: withdrawal.requires_verification
        ? "Withdrawal request submitted for verification. Large withdrawals require additional verification."
        : "Withdrawal request submitted successfully. Processing will complete within 24 hours.",
    });
  } catch (error) {
    console.error("Withdrawal request error:", error);

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
            : "Failed to process withdrawal request",
      },
      { status: 500 },
    );
  }
}
