/**
 * Product Request Detail API
 * GET /api/product-requests/[id] - Get request details
 * PUT /api/product-requests/[id] - Update request (mark fulfilled)
 * Requirements: 19.7, 19.8
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { productRequestService } from "@/lib/services/product-request";

/**
 * GET /api/product-requests/[id]
 * Get product request details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: requestId } = await params;

    // Get request details
    const productRequest =
      await productRequestService.getRequestById(requestId);

    if (!productRequest) {
      return NextResponse.json(
        { error: "Product request not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(productRequest);
  } catch (error) {
    console.error("Error fetching product request:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch product request",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/product-requests/[id]
 * Update product request (mark as fulfilled)
 */
export async function PUT(
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
    const body = await request.json();

    // Only support marking as fulfilled for now
    if (body.action === "mark_fulfilled") {
      const updatedRequest = await productRequestService.markRequestFulfilled({
        request_id: requestId,
        user_id: user.id,
      });

      return NextResponse.json(updatedRequest);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating product request:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update product request",
      },
      { status: 500 },
    );
  }
}
