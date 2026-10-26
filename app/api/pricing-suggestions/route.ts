import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pricingSuggestionService } from "@/lib/services/pricing-suggestion";

/**
 * POST /api/pricing-suggestions
 * Generate pricing suggestion for a listing
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { listingId, factors } = body;

    if (!factors || !factors.category) {
      return NextResponse.json(
        { error: "Missing required fields: factors.category" },
        { status: 400 },
      );
    }

    // Generate pricing suggestion
    const analysis = await pricingSuggestionService.generatePricingSuggestion(
      listingId || `temp-${Date.now()}`,
      user.id,
      factors,
    );

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Error generating pricing suggestion:", error);
    return NextResponse.json(
      { error: "Failed to generate pricing suggestion" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/pricing-suggestions?listingId=xxx
 * Get existing pricing suggestion for a listing
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = request.nextUrl;
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json(
        { error: "Missing required parameter: listingId" },
        { status: 400 },
      );
    }

    // Get pricing suggestion
    const suggestion =
      await pricingSuggestionService.getPricingSuggestion(listingId);

    if (!suggestion) {
      return NextResponse.json(
        { error: "Pricing suggestion not found" },
        { status: 404 },
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
