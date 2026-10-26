import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inventoryService } from "@/lib/services/inventory";

/**
 * PUT /api/inventory/[listingId]/variants
 * Update variants for a specific listing
 */
export async function PUT(
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
    const { variants, unit_price, low_stock_threshold } = body;

    const inventory = await inventoryService.updateInventoryWithVariants(
      listingId,
      user.id,
      variants,
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
    console.error("Error updating variants:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update variants",
      },
      { status: 500 },
    );
  }
}
