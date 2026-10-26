/**
 * Request Offers API
 * POST /api/product-requests/[id]/offers - Submit offer for request
 * GET /api/product-requests/[id]/offers - Get offers for request
 * Requirements: 19.3, 19.4, 19.5
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { productRequestService } from "@/lib/services/product-request";
import { z } from "zod";

// Validation schema for submitting offer
const submitOfferSchema = z.object({
  listing_id: z.string().uuid().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  message: z.string().max(1000).optional(),
});

/**
 * POST /api/product-requests/[id]/offers
 * Submit an offer for a product request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const { id: requestId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = submitOfferSchema.parse(body);

    // Submit offer
    const offer = await productRequestService.submitOffer({
      request_id: requestId,
      seller_id: user.id,
      listing_id: validatedData.listing_id,
      price: validatedData.price,
      message: validatedData.message,
    });

    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    console.error("Error submitting offer:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to submit offer",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/product-requests/[id]/offers
 * Get all offers for a product request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const { id: requestId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as
      | "pending"
      | "accepted"
      | "rejected"
      | null;

    // Get offers
    const offers = await productRequestService.getRequestOffers({
      request_id: requestId,
      status: status || undefined,
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("Error fetching offers:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch offers",
      },
      { status: 500 },
    );
  }
}
