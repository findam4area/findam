import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pricingSuggestionService } from "@/lib/services/pricing-suggestion";

/**
 * GET /api/pricing-suggestions/:id/check-reduction
 * Check if a listing needs price reduction (no views after 48 hours)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: listingId } = await params;

    // Check if price reduction is needed
    const result =
      await pricingSuggestionService.checkPriceReductionNeeded(listingId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error checking price reduction:", error);
    return NextResponse.json(
      { error: "Failed to check price reduction" },
      { status: 500 },
    );
  }
}
