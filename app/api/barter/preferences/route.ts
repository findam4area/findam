/**
 * Barter Preferences API
 *
 * Handles user preferences for barter exchanges.
 *
 * Requirements: 12.1, 12.2, 12.8
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/barter/preferences
 * Get user's barter preferences for their listings
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const listingId = searchParams.get("listingId");

    let query = (supabase.from as any)("barter_preferences")
      .select("*")
      .eq("user_id", user.id);

    if (listingId) {
      query = query.eq("listing_id", listingId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ preferences: data });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/barter/preferences
 * Create or update barter preferences for a listing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      listingId,
      openToExchange,
      preferredCategories,
      minValue,
      maxValue,
    } = body;

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 },
      );
    }

    // Verify user owns the listing
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("user_id")
      .eq("id", listingId)
      .single();

    if (listingError || !listing || listing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Listing not found or unauthorized" },
        { status: 404 },
      );
    }

    // Upsert preferences
    const { data, error } = await (supabase.from as any)("barter_preferences")
      .upsert({
        user_id: user.id,
        listing_id: listingId,
        open_to_exchange: openToExchange ?? true,
        preferred_categories: preferredCategories || [],
        min_value: minValue || null,
        max_value: maxValue || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      preference: data,
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/barter/preferences
 * Remove barter preferences for a listing
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 },
      );
    }

    const { error } = await (supabase.from as any)("barter_preferences")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
