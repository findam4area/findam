/**
 * Business Claim Verification API Route
 * Handles email and domain verification for business claims
 * Requirements: 23.3, 23.4
 */

import { NextRequest, NextResponse } from "next/server";
import { businessClaimService } from "@/lib/services/business-claim";

/**
 * POST /api/business-claims/verify
 * Verify email or domain for a business claim
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { claim_id, token, verification_type } = body;

    // Validate required fields
    if (!claim_id || !token || !verification_type) {
      return NextResponse.json(
        { error: "Missing required fields: claim_id, token, verification_type" },
        { status: 400 }
      );
    }

    if (!["email", "domain"].includes(verification_type)) {
      return NextResponse.json(
        { error: "Invalid verification_type. Must be 'email' or 'domain'" },
        { status: 400 }
      );
    }

    // Verify based on type
    let verified = false;
    if (verification_type === "email") {
      verified = await businessClaimService.verifyEmail(claim_id, token);
    } else {
      verified = await businessClaimService.verifyDomain(claim_id, token);
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `${verification_type === "email" ? "Email" : "Domain"} verified successfully`,
      verified: true,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 }
    );
  }
}
