/**
 * GET /api/shipments/:id/track
 * Track a shipment and return real-time tracking status (Requirement 8.3, 8.9)
 */

import { NextRequest, NextResponse } from "next/server";
import { LogisticsService } from "@/lib/services/logistics";
import { createClient } from "@/lib/supabase/server";

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
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: shipmentId } = await params;

    // Verify shipment exists and user has access
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

    // Check if user is buyer or seller
    const isBuyer = shipment.escrow_transactions.buyer_id === user.id;
    const isSeller = shipment.escrow_transactions.seller_id === user.id;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied. Only buyer or seller can track this shipment.",
        },
        { status: 403 },
      );
    }

    // Get real-time tracking info from logistics provider
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
