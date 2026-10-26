import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inventoryService } from "@/lib/services/inventory";

/**
 * GET /api/inventory/summary
 * Get inventory summary for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await inventoryService.calculateInventoryValue(user.id);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching inventory summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory summary" },
      { status: 500 },
    );
  }
}
