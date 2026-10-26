import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inventoryService } from "@/lib/services/inventory";

/**
 * GET /api/inventory/[listingId]
 * Get inventory for a specific listing
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params to get the listingId
    const { listingId } = await params;

    const inventory = await inventoryService.getInventoryByListing(listingId);

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 },
      );
    }

    // Verify ownership
    if (inventory.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/inventory/[listingId]
 * Update stock for a specific listing
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params to get the listingId
    const { listingId } = await params;

    // Verify listing ownership
    const { data: listing } = await supabase
      .from("listings")
      .select("id, user_id")
      .eq("id", listingId)
      .eq("user_id", user.id)
      .single();

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found or unauthorized" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { stock_quantity, low_stock_threshold, unit_price } = body;

    const inventory = await inventoryService.setStock(
      listingId,
      user.id,
      stock_quantity,
      unit_price,
      low_stock_threshold,
    );

    // Check if low stock notification should be sent
    if (
      inventory.stock_quantity > 0 &&
      inventory.stock_quantity <= inventory.low_stock_threshold
    ) {
      await inventoryService.sendLowStockNotification(user.id, inventory);
    }

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Error updating inventory:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update inventory",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/inventory/[listingId]
 * Update stock for a specific listing (alias for PATCH)
 * Requirements: 11.1
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> },
) {
  return PATCH(request, { params });
}
