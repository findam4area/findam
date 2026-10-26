/**
 * Buying Guide by ID API
 * GET /api/buying-guides/[id] - Get specific buying guide
 * Requirements: 22.1
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BuyingGuideService } from "@/lib/services/buying-guide";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();

    // Get current user (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Await params to get the id
    const { id } = await params;

    const guide = await BuyingGuideService.getGuideById(id, user?.id);

    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    return NextResponse.json({ guide });
  } catch (error) {
    console.error("Error fetching buying guide:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch buying guide",
      },
      { status: 500 },
    );
  }
}
