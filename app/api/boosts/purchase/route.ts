/**
 * POST /api/boosts/purchase
 * Purchase a boost for a listing
 * Requirements: 14.1, 14.9
 * Task: 34.1, 37.1
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { boostService } from "@/lib/services/boost";
import { validateBoostPackage } from "@/lib/types";

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

    // Parse request body
    const body = await request.json();
    const { listing_id, package_type } = body;

    // Validate required fields
    if (!listing_id || !package_type) {
      return NextResponse.json(
        { error: "Missing required fields: listing_id, package_type" },
        { status: 400 },
      );
    }

    // Validate package type
    if (!validateBoostPackage(package_type)) {
      return NextResponse.json(
        {
          error:
            "Invalid package_type. Must be 'basic', 'standard', or 'premium'",
        },
        { status: 400 },
      );
    }

    // Get user email
    const { data: userData, error: userError } = await (supabase as any)
      .from("users")
      .select("email")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 },
      );
    }

    // Purchase boost
    const result = await boostService.purchaseBoost({
      user_id: user.id,
      listing_id,
      package_type,
      email: userData.email,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error purchasing boost:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to purchase boost",
      },
      { status: 500 },
    );
  }
}
