import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inventoryService } from "@/lib/services/inventory";
import type { BulkStockUpdate } from "@/lib/types";

/**
 * POST /api/inventory/bulk-update
 * Bulk update stock for multiple listings
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body as { updates: BulkStockUpdate[] };

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Invalid updates array" },
        { status: 400 },
      );
    }

    // Rate limiting: max 100 updates at once
    if (updates.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 updates allowed per request" },
        { status: 400 },
      );
    }

    const result = await inventoryService.bulkUpdateStock(user.id, updates);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error bulk updating inventory:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to bulk update inventory",
      },
      { status: 500 },
    );
  }
}
