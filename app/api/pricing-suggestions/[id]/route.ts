import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pricingSuggestionService } from "@/lib/services/pricing-suggestion";

/**
 * GET /api/pricing-suggestions/:id
 * Get pricing suggestion for a specific listing
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

    // Get pricing suggestion
    const suggestion =
      await pricingSuggestionService.getPricingSuggestion(listingId);

    if (!suggestion) {
      return NextResponse.json(
        { error: "Pricing suggestion not found" },
        { status: 404 },
      );
    }

    // Verify user owns the listing
    if (suggestion.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You do not own this listing" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      suggestion,
    });
  } catch (error) {
    console.error("Error fetching pricing suggestion:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing suggestion" },
      { status: 500 },
    );
  }
}
