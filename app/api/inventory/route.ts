import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inventoryService } from "@/lib/services/inventory";

/**
 * GET /api/inventory
 * Get all inventory items for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: any = {};

    if (searchParams.get("is_sold_out") === "true") {
      filters.is_sold_out = true;
    }

    if (searchParams.get("is_low_stock") === "true") {
      filters.is_low_stock = true;
    }

    if (searchParams.get("has_variants") === "true") {
      filters.has_variants = true;
    }

    const inventory = await inventoryService.getUserInventory(user.id, filters);

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 },
    );
  }
}
