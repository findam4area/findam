/**
 * POST /api/webhooks/logistics/:partner
 * Handle partner webhook updates for shipment status (Requirement 8.3, 8.4)
 *
 * Supported partners: GIG, Kwik, Sendbox, Gokada, Redbox, Bolt
 */

import { NextRequest, NextResponse } from "next/server";
import { LogisticsService } from "@/lib/services/logistics";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import crypto from "crypto";
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
});

const SUPPORTED_PARTNERS = [
  "GIG",
  "Kwik",
  "Sendbox",
  "Gokada",
  "Redbox",
  "Bolt",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ partner: string }> },
) {
  try {
    const { partner } = await params;

    // Validate partner
    if (!SUPPORTED_PARTNERS.includes(partner)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported logistics partner: ${partner}`,
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    // Validate webhook payload
    const validatedData = WebhookSchema.parse(body);

    // Verify webhook signature for security
    const signature = request.headers.get("x-webhook-signature") || "";
    const isValid = await verifyWebhookSignature(partner, signature, body);

    if (!isValid && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    // Find shipment by tracking number
    const supabase = await createClient();

    const { data: shipment, error } = await supabase
      .from("shipments")
      .select("id, provider_id, logistics_providers(name)")
      .eq("tracking_number", validatedData.trackingNumber)
      .single();

    if (error || !shipment) {
      return NextResponse.json(
        {
          success: false,
          error: `Shipment not found for tracking number: ${validatedData.trackingNumber}`,
        },
        { status: 404 },
      );
    }

    // Verify the webhook is from the correct provider
    if (shipment.logistics_providers.name !== partner) {
      return NextResponse.json(
        {
          success: false,
          error: `Webhook partner mismatch. Expected ${shipment.logistics_providers.name}, got ${partner}`,
        },
        { status: 400 },
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
      shipmentId: shipment.id,
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
 * Each provider has their own signature algorithm
 */
async function verifyWebhookSignature(
  partner: string,
  signature: string,
  payload: any,
): Promise<boolean> {
  // In development, skip verification
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  try {
    const secretKey = getWebhookSecret(partner);
    if (!secretKey) {
      console.warn(`No webhook secret configured for ${partner}`);
      return false;
    }

    // Generate expected signature using HMAC SHA256
    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(JSON.stringify(payload))
      .digest("hex");

    // Compare signatures (timing-safe comparison)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch (error) {
    console.error(`Error verifying webhook signature for ${partner}:`, error);
    return false;
  }
}

/**
 * Get webhook secret for a specific partner
 */
function getWebhookSecret(partner: string): string | undefined {
  const secretMap: Record<string, string | undefined> = {
    GIG: process.env.GIG_WEBHOOK_SECRET,
    Kwik: process.env.KWIK_WEBHOOK_SECRET,
    Sendbox: process.env.SENDBOX_WEBHOOK_SECRET,
    Gokada: process.env.GOKADA_WEBHOOK_SECRET,
    Redbox: process.env.REDBOX_WEBHOOK_SECRET,
    Bolt: process.env.BOLT_WEBHOOK_SECRET,
  };

  return secretMap[partner];
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
    cancelled: "failed",
    returned: "failed",
  };

  return statusMap[providerStatus.toLowerCase()] || "pending";
}
