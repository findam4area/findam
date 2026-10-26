/**
 * Business Claims API Routes
 * Handles business ownership claim requests
 * Requirements: 23.1, 23.2, 23.3, 23.4, 23.5
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { businessClaimService } from "@/lib/services/business-claim";

/**
 * GET /api/business-claims
 * Get user's claim requests or claimable businesses
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "user_claims";

    if (type === "user_claims") {
      // Get user's claim requests
      const claims = await businessClaimService.getUserClaims(user.id);
      return NextResponse.json({ claims });
    }

    if (type === "claimable") {
      // Get claimable businesses
      const city = searchParams.get("city") || undefined;
      const state = searchParams.get("state") || undefined;
      const category_id = searchParams.get("category_id") || undefined;
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");

      const businesses = await businessClaimService.getClaimableBusinesses({
        city,
        state,
        category_id,
        limit,
        offset,
      });

      return NextResponse.json({ businesses });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error) {
    console.error("Get business claims error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch claims" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business-claims
 * Initiate a new business claim
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { business_profile_id, claim_justification, business_email, domain } = body;

    // Validate required fields
    if (!business_profile_id || !claim_justification || !business_email) {
      return NextResponse.json(
        { error: "Missing required fields: business_profile_id, claim_justification, business_email" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(business_email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Initiate claim
    const claim = await businessClaimService.initiateClaim({
      business_profile_id,
      claimant_user_id: user.id,
      claim_justification,
      business_email,
      domain,
    });

    return NextResponse.json({
      claim,
      message: "Claim initiated successfully. Please check your email to verify ownership.",
    }, { status: 201 });
  } catch (error) {
    console.error("Create business claim error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create claim" },
      { status: 500 }
    );
  }
}
