// Price Drop Battle - Reject/Cancel Battle
// POST /api/price-drop-battles/:id/reject

import { NextRequest, NextResponse } from "next/server";
import { PriceDropBattleService } from "@/lib/services/price-drop-battle";

const battleService = new PriceDropBattleService();

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: battleId } = await params;

    const battle = await battleService.rejectBattle(battleId);

    return NextResponse.json({ battle }, { status: 200 });
  } catch (error: any) {
    console.error("Error rejecting battle:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject battle" },
      { status: 500 },
    );
  }
}
