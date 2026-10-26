// Price Drop Battle - Counter Offer
// Task 70.6: POST /api/price-drop-battles/:id/counter

import { NextRequest, NextResponse } from "next/server";
import { PriceDropBattleService } from "@/lib/services/price-drop-battle";

const battleService = new PriceDropBattleService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: battleId } = await params;
    const body = await request.json();

    const { offer_amount, message } = body;

    // Validation
    if (!offer_amount) {
      return NextResponse.json(
        { error: "Offer amount is required" },
        { status: 400 },
      );
    }

    if (typeof offer_amount !== "number" || offer_amount <= 0) {
      return NextResponse.json(
        { error: "Offer amount must be a positive number" },
        { status: 400 },
      );
    }

    const offer = await battleService.makeCounterOffer(
      battleId,
      offer_amount,
      message,
    );

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error: any) {
    console.error("Error making counter offer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to make counter offer" },
      { status: 500 },
    );
  }
}
