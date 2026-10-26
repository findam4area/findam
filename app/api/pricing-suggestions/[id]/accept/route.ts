import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pricingSuggestionService } from "@/lib/services/pricing-suggestion";

/**
 * POST /api/pricing-suggestions/:id/accept
 * Accept a pricing suggestion and update listing price
 */
export async function POST(
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

    const { id: suggestionId } = await params;

    // Accept pricing suggestion
    const success = await pricingSuggestionService.acceptPricingSuggestion(
      suggestionId,
      user.id,
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to accept pricing suggestion" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pricing suggestion accepted and listing price updated",
    });
  } catch (error) {
    console.error("Error accepting pricing suggestion:", error);
    return NextResponse.json(
      { error: "Failed to accept pricing suggestion" },
      { status: 500 },
    );
  }
}
