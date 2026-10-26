/**
 * POST /api/logistics/rate
 * Rate delivery experience (Requirement 8.7)
 */

import { NextRequest, NextResponse } from "next/server";
import { LogisticsService } from "@/lib/services/logistics";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const RateDeliverySchema = z.object({
  shipmentId: z.string().uuid("Invalid shipment ID"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  review: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Validate request
    const validatedData = RateDeliverySchema.parse(body);

    // Verify user is the buyer of the order
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("*, escrow_transactions(buyer_id)")
      .eq("id", validatedData.shipmentId)
      .single();

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 },
      );
    }

    if (shipment.escrow_transactions.buyer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Only the buyer can rate delivery" },
        { status: 403 },
      );
    }

    // Check if shipment is delivered
    if (shipment.status !== "delivered") {
      return NextResponse.json(
        { success: false, error: "Can only rate delivered shipments" },
        { status: 400 },
      );
    }

    // Rate delivery
    await LogisticsService.rateDelivery(validatedData);

    return NextResponse.json({
      success: true,
      message: "Delivery rated successfully",
    });
  } catch (error) {
    console.error("Error rating delivery:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to rate delivery",
      },
      { status: 500 },
    );
  }
}
