/**
 * Purchase History Reorder API
 * POST /api/purchase-history/[id]/reorder - Reorder a previously purchased item
 * Requirements: 20.5, 20.6, 20.7
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PurchaseHistoryService } from "@/lib/services/purchase-history";

export async function POST(
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

    const { id: purchaseRecordId } = await params;

    // Attempt to reorder
    const result = await PurchaseHistoryService.reorderItem(
      user.id,
      purchaseRecordId,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error reordering item:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to reorder item",
      },
      { status: 500 },
    );
  }
}
