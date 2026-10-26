/**
 * Offer Management API
 * PUT /api/product-requests/[id]/offers/[offerId] - Accept or reject offer
 * Requirements: 19.5
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { productRequestService } from "@/lib/services/product-request";
import { z } from "zod";

// Validation schema for offer action
const offerActionSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

/**
 * PUT /api/product-requests/[id]/offers/[offerId]
 * Accept or reject an offer
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> },
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { offerId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = offerActionSchema.parse(body);

    let updatedOffer;

    if (validatedData.action === "accept") {
      updatedOffer = await productRequestService.acceptOffer({
        offer_id: offerId,
        requester_id: user.id,
      });
    } else {
      updatedOffer = await productRequestService.rejectOffer({
        offer_id: offerId,
        requester_id: user.id,
      });
    }

    return NextResponse.json(updatedOffer);
  } catch (error) {
    console.error("Error updating offer:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update offer",
      },
      { status: 500 },
    );
  }
}
