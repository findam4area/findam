// Skill Offers API Endpoints
// Task 70.1: POST /api/skill-offers - Create skill offer

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SkillSwapService } from "@/lib/services/skill-swap";

const skillSwapService = new SkillSwapService();

// GET /api/skill-offers - Get all skill offers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const openToExchange = searchParams.get("open_to_exchange") === "true";

    const filters: any = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (openToExchange) filters.open_to_exchange = true;

    const offers = await skillSwapService.getSkillOffers(filters);

    return NextResponse.json({ offers }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching skill offers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch skill offers" },
      { status: 500 },
    );
  }
}

// POST /api/skill-offers - Create new skill offer
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const {
      title,
      description,
      category,
      skill_tags,
      open_to_exchange,
      hourly_rate,
      exchange_preferences,
      portfolio_items,
      availability,
    } = body;

    // Validation
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 },
      );
    }

    const offer = await skillSwapService.createSkillOffer(user.id, {
      title,
      description,
      category,
      skill_tags: skill_tags || [],
      open_to_exchange: open_to_exchange ?? true,
      hourly_rate,
      exchange_preferences,
      portfolio_items,
      availability,
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating skill offer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create skill offer" },
      { status: 500 },
    );
  }
}
