/**
 * GET /api/boosts/verify
 * Verify boost payment and activate boost
 * Requirements: 14.1, 14.9
 * Task: 34.1
 */

import { NextRequest, NextResponse } from "next/server";
import { boostService } from "@/lib/services/boost";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Missing payment reference" },
        { status: 400 },
      );
    }

    // Confirm payment and activate boost
    const boost = await boostService.confirmBoostPayment({ reference });

    // Redirect to listing page with success message
    const redirectUrl = new URL(
      `/listing/${boost.listing_id}?boost_activated=true`,
      request.url,
    );
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error verifying boost payment:", error);

    // Redirect to error page
    const errorUrl = new URL("/payments/error", request.url);
    errorUrl.searchParams.set(
      "message",
      error instanceof Error ? error.message : "Payment verification failed",
    );
    return NextResponse.redirect(errorUrl);
  }
}
