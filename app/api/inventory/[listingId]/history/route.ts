import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inventoryService } from "@/lib/services/inventory";

/**
 * GET /api/inventory/[listingId]/history
 * Get stock history for a specific listing
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

    const history = await inventoryService.getStockHistory(listingId);

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching stock history:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock history" },
      { status: 500 },
    );
  }
}
