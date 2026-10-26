/**
 * GET/POST /api/logistics/quotes
 * Get shipping quotes from all providers (Requirement 8.10)
 */

import { NextRequest, NextResponse } from "next/server";
import { LogisticsService } from "@/lib/services/logistics";
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

const GetQuotesSchema = z.object({
  pickupAddress: AddressSchema,
  deliveryAddress: AddressSchema,
  packageDetails: PackageDetailsSchema,
});

/**
 * GET /api/logistics/quotes
 * Get shipping quotes from query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const pickupAddress = JSON.parse(searchParams.get("pickupAddress") || "{}");
    const deliveryAddress = JSON.parse(
      searchParams.get("deliveryAddress") || "{}",
    );
    const packageDetails = JSON.parse(
      searchParams.get("packageDetails") || "{}",
    );

    // Validate request
    const validatedData = GetQuotesSchema.parse({
      pickupAddress,
      deliveryAddress,
      packageDetails,
    });

    // Get quotes from all providers
    const quotes = await LogisticsService.getQuotes(validatedData);

    return NextResponse.json({
      success: true,
      data: quotes,
    });
  } catch (error) {
    console.error("Error fetching shipping quotes:", error);

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
          error instanceof Error ? error.message : "Failed to fetch quotes",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/logistics/quotes
 * Get shipping quotes from request body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validatedData = GetQuotesSchema.parse(body);

    // Get quotes from all providers
    const quotes = await LogisticsService.getQuotes(validatedData);

    return NextResponse.json({
      success: true,
      data: quotes,
    });
  } catch (error) {
    console.error("Error fetching shipping quotes:", error);

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
          error instanceof Error ? error.message : "Failed to fetch quotes",
      },
      { status: 500 },
    );
  }
}
