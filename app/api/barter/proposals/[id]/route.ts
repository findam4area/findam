/**
 * Barter Proposal Actions API
 *
 * Handles accepting, rejecting, and counter-proposing barter proposals.
 *
 * Requirements: 12.5, 12.6
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { barterService } from "@/lib/services/barter";

/**
 * GET /api/barter/proposals/[id]
 * Get a specific proposal by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params to get the id
    const { id } = await params;

    const { data: proposal, error } = await (supabase.from as any)(
      "barter_proposals",
    )
      .select(
        `
        *,
        target_listing:listings!target_listing_id(id, title, price, images, user_id),
        offered_listing:listings!offered_listing_id(id, title, price, images, user_id),
        proposer:users!proposer_id(id, username, avatar_url),
        receiver:users!receiver_id(id, username, avatar_url)
      `,
      )
      .eq("id", id)
      .or(`proposer_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .single();

    if (error || !proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/barter/proposals/[id]
 * Accept, reject, or counter a proposal
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { action, cashAdjustment, message } = body;

    if (!action || !["accept", "reject", "counter"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Await params to get the id
    const { id } = await params;

    let result:
      | { success: boolean; error?: string; proposalId?: string }
      | undefined;

    switch (action) {
      case "accept":
        result = await barterService.acceptProposal(id, user.id);
        break;
      case "reject":
        result = await barterService.rejectProposal(id, user.id);
        break;
      case "counter":
        if (cashAdjustment === undefined) {
          return NextResponse.json(
            { error: "Cash adjustment required for counter-proposal" },
            { status: 400 },
          );
        }
        result = await barterService.counterProposal(
          id,
          user.id,
          cashAdjustment,
          message,
        );
        break;
    }

    if (!result || !result.success) {
      return NextResponse.json(
        { error: result?.error || "Failed to process proposal" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      proposalId: result.proposalId,
    });
  } catch (error) {
    console.error("Error updating proposal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
