/**
 * POST /api/logistics/shipments
 * Create a new shipment (Requirement 8.2)
 */

import { NextRequest, NextResponse } from "next/server";
import { LogisticsService } from "@/lib/services/logistics";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const AddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().optional(),
  country: z.string().default("Nigeria"),
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
});

const PackageDetailsSchema = z.object({
  weight: z.number().positive("Weight must be positive"),
  dimensions: z.object({
    length: z.number().positive("Length must be positive"),
    width: z.number().positive("Width must be positive"),
    height: z.number().positive("Height must be positive"),
  }),
  value: z.number().positive("Value must be positive"),
  description: z.string().min(1, "Description is required"),
});

const CreateShipmentSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  providerId: z.string().uuid("Invalid provider ID"),
  pickupAddress: AddressSchema,
  deliveryAddress: AddressSchema,
  packageDetails: PackageDetailsSchema,
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
    const validatedData = CreateShipmentSchema.parse(body);

    // Verify user is the seller of the order
    const { data: order, error: orderError } = await supabase
      .from("escrow_transactions")
      .select("seller_id")
      .eq("id", validatedData.orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    if (order.seller_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Only the seller can create shipments" },
        { status: 403 },
      );
    }

    // Create shipment
    const shipment = await LogisticsService.createShipment(validatedData);

    return NextResponse.json({
      success: true,
      data: shipment,
    });
  } catch (error) {
    console.error("Error creating shipment:", error);

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
          error instanceof Error ? error.message : "Failed to create shipment",
      },
      { status: 500 },
    );
  }
}
