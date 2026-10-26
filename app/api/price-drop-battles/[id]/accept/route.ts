// Price Drop Battle - Accept Offer
// POST /api/price-drop-battles/:id/accept

import { NextRequest, NextResponse } from "next/server";
import { PriceDropBattleService } from "@/lib/services/price-drop-battle";

const battleService = new PriceDropBattleService();

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: battleId } = await params;

    const battle = await battleService.acceptOffer(battleId);

    return NextResponse.json({ battle }, { status: 200 });
  } catch (error: any) {
    console.error("Error accepting offer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept offer" },
      { status: 500 },
    );
  }
}
