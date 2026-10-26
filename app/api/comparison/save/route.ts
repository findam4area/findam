/**
 * Save Comparison API Route
 * Saves a comparison set for later review
 * Requirements: 3.8
 * Tasks: 22.8
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const saveComparisonSchema = z.object({
  name: z.string().min(1).max(100),
  listing_ids: z.array(z.string().uuid()).min(2).max(4),
  category_id: z.string().uuid(),
});

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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = saveComparisonSchema.parse(body);

    // Validate all listings exist and are in the same category
    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select("id, category_id, is_active")
      .in("id", validatedData.listing_ids);

    if (listingsError) {
      return NextResponse.json(
        { error: "Failed to validate listings" },
        { status: 500 },
      );
    }

    if (!listings || listings.length !== validatedData.listing_ids.length) {
      return NextResponse.json(
        { error: "One or more listings not found" },
        { status: 404 },
      );
    }

    // Validate all listings are active
    const inactiveListings = listings.filter((l) => !l.is_active);
    if (inactiveListings.length > 0) {
      return NextResponse.json(
        { error: "Cannot save comparison with inactive listings" },
        { status: 400 },
      );
    }

    // Validate all listings are in the same category (Requirement 3.10)
    const categories = new Set(listings.map((l) => l.category_id));
    if (categories.size > 1) {
      return NextResponse.json(
        { error: "All listings must be in the same category" },
        { status: 400 },
      );
    }

    // Create comparison set
    const { data: comparisonSet, error: createError } = await supabase
      .from("comparison_sets")
      .insert({
        user_id: user.id,
        listing_ids: validatedData.listing_ids,
        category_id: validatedData.category_id,
        name: validatedData.name,
        is_saved: true,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating comparison set:", createError);
      return NextResponse.json(
        { error: "Failed to save comparison" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        comparison: comparisonSet,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in save comparison API:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
