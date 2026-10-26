// Price Drop Battle - Get by ID
// GET /api/price-drop-battles/:id

import { NextRequest, NextResponse } from "next/server";
import { PriceDropBattleService } from "@/lib/services/price-drop-battle";

const battleService = new PriceDropBattleService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: battleId } = await params;

    const battle = await battleService.getBattleById(battleId);

    if (!battle) {
      return NextResponse.json({ error: "Battle not found" }, { status: 404 });
    }

    const offers = await battleService.getBattleOffers(battleId);

    return NextResponse.json({ battle, offers }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching battle:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch battle" },
      { status: 500 },
    );
  }
}
