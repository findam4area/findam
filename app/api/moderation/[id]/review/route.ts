/**
 * POST /api/moderation/:id/review
 *
 * Allow admin to approve or reject flagged listings.
 * Store admin notes and decision.
 *
 * Requirements: 6.6
 * Task: 10.3
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

interface ReviewRequest {
  decision: "approve" | "reject";
  notes?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    // Check authentication and admin role
    const authError = await requireAdmin(supabase);
    if (authError) return authError;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { decision, notes } = body;

    // Validate decision
    if (!decision || !["approve", "reject"].includes(decision)) {
      return NextResponse.json(
        { error: "Invalid decision. Must be 'approve' or 'reject'" },
        { status: 400 },
      );
    }

    const { id: moderationId } = await params;

    // Update moderation result with admin review
    const { data: moderationResult, error: updateError } = await supabase
      .from("moderation_results")
      .update({
        admin_reviewed: true,
        admin_id: user.id,
        admin_notes: notes || null,
        admin_decision: decision,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", moderationId)
      .select("listing_id, user_id")
      .single();

    if (updateError) {
      console.error("Error updating moderation result:", updateError);
      return NextResponse.json(
        { error: "Failed to update moderation result" },
        { status: 500 },
      );
    }

    // If rejected, update the listing status
    if (decision === "reject" && moderationResult.listing_id) {
      const { error: listingError } = await supabase
        .from("listings")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", moderationResult.listing_id);

      if (listingError) {
        console.error("Error updating listing status:", listingError);
        // Don't fail the request, just log the error
      }

      // TODO: Send notification to seller about rejection
    }

    // If approved, ensure listing is active
    if (decision === "approve" && moderationResult.listing_id) {
      const { error: listingError } = await supabase
        .from("listings")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", moderationResult.listing_id);

      if (listingError) {
        console.error("Error updating listing status:", listingError);
        // Don't fail the request, just log the error
      }

      // TODO: Send notification to seller about approval
    }

    return NextResponse.json({
      success: true,
      message: `Listing ${decision === "approve" ? "approved" : "rejected"} successfully`,
      moderationId,
      decision,
    });
  } catch (error) {
    console.error("Error in moderation review endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
