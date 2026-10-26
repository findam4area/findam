/**
 * POST /api/logistics/webhook
 * Webhook handler for logistics provider status updates (Requirement 8.3, 8.4)
 */

import { NextRequest, NextResponse } from "next/server";
import { LogisticsService } from "@/lib/services/logistics";
import { z } from "zod";
import type { ShipmentStatus } from "@/lib/types/logistics";

const WebhookSchema = z.object({
  trackingNumber: z.string(),
  status: z.string(),
  location: z.string().optional(),
  description: z.string(),
  deliveryPerson: z
    .object({
      name: z.string(),
      phone: z.string(),
      photo: z.string().optional(),
    })
    .optional(),
  timestamp: z.string().optional(),
  provider: z.string(),
  signature: z.string(), // For webhook verification
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate webhook payload
    const validatedData = WebhookSchema.parse(body);

    // Verify webhook signature (in production, verify against provider's signature)
    // For now, we'll skip signature verification in development
    if (process.env.NODE_ENV === "production") {
      const isValid = await verifyWebhookSignature(
        validatedData.provider,
        validatedData.signature,
        body,
      );

      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid webhook signature" },
          { status: 401 },
        );
      }
    }

    // Find shipment by tracking number
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: shipment, error } = await supabase
      .from("shipments")
      .select("id")
      .eq("tracking_number", validatedData.trackingNumber)
      .single();

    if (error || !shipment) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 },
      );
    }

    // Update shipment status
    await LogisticsService.updateShipmentStatus({
      shipmentId: shipment.id,
      status: mapProviderStatus(validatedData.status),
      location: validatedData.location,
      description: validatedData.description,
      deliveryPerson: validatedData.deliveryPerson,
    });

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Error processing logistics webhook:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid webhook payload",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process webhook",
      },
      { status: 500 },
    );
  }
}

/**
 * Verify webhook signature from logistics provider
 */
async function verifyWebhookSignature(
  provider: string,
  signature: string,
  payload: any,
): Promise<boolean> {
  // In production, implement signature verification for each provider
  // Each provider has their own signature algorithm
  // Example for GIG:
  // const secret = process.env.GIG_WEBHOOK_SECRET;
  // const expectedSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  // return signature === expectedSignature;

  // For now, return true in development
  return true;
}

/**
 * Map provider-specific status to our standard status
 */
function mapProviderStatus(providerStatus: string): ShipmentStatus {
  const statusMap: Record<string, ShipmentStatus> = {
    pending: "pending",
    "picked up": "picked_up",
    picked_up: "picked_up",
    "in transit": "in_transit",
    in_transit: "in_transit",
    "out for delivery": "out_for_delivery",
    out_for_delivery: "out_for_delivery",
    delivered: "delivered",
    failed: "failed",
  };

  return statusMap[providerStatus.toLowerCase()] || "pending";
}
