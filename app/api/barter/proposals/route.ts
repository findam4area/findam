/**
 * Barter Proposals API
 *
 * Handles creation and retrieval of barter proposals.
 *
 * Requirements: 12.3, 12.4
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { barterService } from "@/lib/services/barter";

/**
 * GET /api/barter/proposals
 * Get user's barter proposals (received or sent)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type =
      (searchParams.get("type") as "received" | "sent") || "received";

    const result = await barterService.getUserProposals(user.id, type);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      proposals: result.proposals,
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/barter/proposals
 * Create a new barter proposal
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetListingId, offeredListingId, message, cashAdjustment } = body;

    if (!targetListingId || !offeredListingId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await barterService.createProposal({
      targetListingId,
      offeredListingId,
      proposerId: user.id,
      message,
      cashAdjustment: cashAdjustment || 0,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      proposalId: result.proposalId,
    });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
