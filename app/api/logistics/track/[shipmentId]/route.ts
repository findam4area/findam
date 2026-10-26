/**
 * GET /api/logistics/track/[shipmentId]
 * Track a shipment (Requirement 8.3, 8.9)
 */

import { NextRequest, NextResponse } from "next/server";
import { LogisticsService } from "@/lib/services/logistics";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> },
) {
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

    const { shipmentId } = await params;

    // Verify user has access to this shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("*, escrow_transactions(buyer_id, seller_id)")
      .eq("id", shipmentId)
      .single();

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 },
      );
    }

    const isBuyer = shipment.escrow_transactions.buyer_id === user.id;
    const isSeller = shipment.escrow_transactions.seller_id === user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Get tracking info
    const trackingInfo = await LogisticsService.trackShipment(shipmentId);

    return NextResponse.json({
      success: true,
      data: trackingInfo,
    });
  } catch (error) {
    console.error("Error tracking shipment:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to track shipment",
      },
      { status: 500 },
    );
  }
}
