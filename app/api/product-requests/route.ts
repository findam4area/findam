/**
 * Product Requests API
 * POST /api/product-requests - Create new product request
 * GET /api/product-requests - Get active product requests (feed)
 * Requirements: 19.1, 19.2
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { productRequestService } from "@/lib/services/product-request";
import { z } from "zod";

// Validation schema for creating product request
const createRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  category_id: z.string().uuid().optional(),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
  preferred_location: z.string().max(200).optional(),
});

/**
 * POST /api/product-requests
 * Create a new product request
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createRequestSchema.parse(body);

    // Validate budget range
    if (
      validatedData.budget_min !== undefined &&
      validatedData.budget_max !== undefined &&
      validatedData.budget_max < validatedData.budget_min
    ) {
      return NextResponse.json(
        {
          error:
            "Maximum budget must be greater than or equal to minimum budget",
        },
        { status: 400 },
      );
    }

    // Create product request
    const productRequest = await productRequestService.createRequest({
      user_id: user.id,
      title: validatedData.title,
      description: validatedData.description,
      category_id: validatedData.category_id,
      budget_min: validatedData.budget_min,
      budget_max: validatedData.budget_max,
      preferred_location: validatedData.preferred_location,
    });

    return NextResponse.json(productRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating product request:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create product request",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/product-requests
 * Get active product requests (feed)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const category_id = searchParams.get("category_id") || undefined;
    const budget_min = searchParams.get("budget_min")
      ? parseFloat(searchParams.get("budget_min")!)
      : undefined;
    const budget_max = searchParams.get("budget_max")
      ? parseFloat(searchParams.get("budget_max")!)
      : undefined;
    const location = searchParams.get("location") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 20;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;

    // Get active requests
    const requests = await productRequestService.getActiveRequests({
      filters: {
        category_id,
        budget_min,
        budget_max,
        location,
        search,
      },
      limit,
      offset,
    });

    return NextResponse.json({
      requests,
      pagination: {
        limit,
        offset,
        count: requests.length,
      },
    });
  } catch (error) {
    console.error("Error fetching product requests:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch product requests",
      },
      { status: 500 },
    );
  }
}
