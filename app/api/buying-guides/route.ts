/**
 * Buying Guides API
 * GET /api/buying-guides - Get all buying guides or search
 * Requirements: 22.1, 22.7
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BuyingGuideService } from "@/lib/services/buying-guide";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const categoryId = searchParams.get("categoryId");

    let guides;

    if (query) {
      // Search guides
      guides = await BuyingGuideService.searchGuides(query);
    } else if (categoryId) {
      // Get guide by category
      const guide = await BuyingGuideService.getGuideByCategory(
        categoryId,
        user?.id,
      );
      return NextResponse.json({ guide });
    } else {
      // Get all guides
      guides = await BuyingGuideService.getAllGuides(user?.id);
    }

    return NextResponse.json({ guides });
  } catch (error) {
    console.error("Error fetching buying guides:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch buying guides",
      },
      { status: 500 },
    );
  }
}
