// Price Drop Battles API Endpoints
// Task 70.5: POST /api/price-drop-battles - Start price drop battle

import { NextRequest, NextResponse } from "next/server";
import { PriceDropBattleService } from "@/lib/services/price-drop-battle";

const battleService = new PriceDropBattleService();

// POST /api/price-drop-battles - Start new battle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { listing_id, initial_offer } = body;

    // Validation
    if (!listing_id || !initial_offer) {
      return NextResponse.json(
        { error: "Listing ID and initial offer are required" },
        { status: 400 },
      );
    }

    if (typeof initial_offer !== "number" || initial_offer <= 0) {
      return NextResponse.json(
        { error: "Initial offer must be a positive number" },
        { status: 400 },
      );
    }

    const battleId = await battleService.startBattle(listing_id, initial_offer);

    return NextResponse.json({ battle_id: battleId }, { status: 201 });
  } catch (error: any) {
    console.error("Error starting battle:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start battle" },
      { status: 500 },
    );
  }
}

// GET /api/price-drop-battles - Get user's battles
export async function GET(request: NextRequest) {
  try {
    const battles = await battleService.getActiveBattles();

    return NextResponse.json({ battles }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching battles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch battles" },
      { status: 500 },
    );
  }
}
