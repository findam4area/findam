/**
 * Buying Guide Bookmark API
 * POST /api/buying-guides/[id]/bookmark - Bookmark a guide
 * DELETE /api/buying-guides/[id]/bookmark - Remove bookmark
 * Requirements: 22.8
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BuyingGuideService } from "@/lib/services/buying-guide";

export async function POST(
  _request: NextRequest,
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

    // Await params to get the id
    const { id } = await params;

    await BuyingGuideService.bookmarkGuide(user.id, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error bookmarking guide:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to bookmark guide",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    // Await params to get the id
    const { id } = await params;

    await BuyingGuideService.unbookmarkGuide(user.id, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to remove bookmark",
      },
      { status: 500 },
    );
  }
}
