/**
 * Safe Locations API
 * GET /api/meetups/safe-locations - Get safe meetup location suggestions
 * Requirements: 21.1, 21.2
 */

import { NextRequest, NextResponse } from "next/server";
import { MeetupService } from "@/lib/services/meetup";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const buyerLat = parseFloat(searchParams.get("buyerLat") || "0");
    const buyerLng = parseFloat(searchParams.get("buyerLng") || "0");
    const sellerLat = parseFloat(searchParams.get("sellerLat") || "0");
    const sellerLng = parseFloat(searchParams.get("sellerLng") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!buyerLat || !buyerLng || !sellerLat || !sellerLng) {
      return NextResponse.json(
        { error: "Missing location coordinates" },
        { status: 400 },
      );
    }

    const locations = await MeetupService.getSafeLocations(
      buyerLat,
      buyerLng,
      sellerLat,
      sellerLng,
      limit,
    );

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Error fetching safe locations:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch safe locations",
      },
      { status: 500 },
    );
  }
}
