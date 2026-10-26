import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SkillSwapService } from "@/lib/services/skill-swap";

const skillSwapService = new SkillSwapService();

// POST /api/skill-exchanges - Propose new skill exchange
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
      provider_id,
      requester_skill,
      provider_skill,
      description,
      agreed_hours_requester,
      agreed_hours_provider,
    } = body;

    // Validation
    if (!provider_id || !requester_skill || !provider_skill) {
      return NextResponse.json(
        {
          error:
            "Provider ID, requester skill, and provider skill are required",
        },
        { status: 400 },
      );
    }

    if (!agreed_hours_requester || !agreed_hours_provider) {
      return NextResponse.json(
        { error: "Agreed hours for both parties are required" },
        { status: 400 },
      );
    }

    const exchange = await skillSwapService.proposeExchange(user.id, {
      provider_id,
      requester_skill,
      provider_skill,
      description: description || "",
      agreed_hours_requester,
      agreed_hours_provider,
    });

    return NextResponse.json({ exchange }, { status: 201 });
  } catch (error: any) {
    console.error("Error proposing skill exchange:", error);
    return NextResponse.json(
      { error: error.message || "Failed to propose skill exchange" },
      { status: 500 },
    );
  }
}

// GET /api/skill-exchanges - Get user's skill exchanges
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;

    const exchanges = await skillSwapService.getUserExchanges(user.id);

    return NextResponse.json({ exchanges }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching skill exchanges:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch skill exchanges" },
      { status: 500 },
    );
  }
}
