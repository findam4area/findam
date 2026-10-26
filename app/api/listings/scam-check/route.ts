import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectScamPatterns, shouldAutoFlag } from "@/lib/utils/scam-detection";
import type { Listing } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { listing_id } = body;

    if (!listing_id) {
      return NextResponse.json(
        { message: "Listing ID required" },
        { status: 400 },
      );
    }

    // Fetch listing with category
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select(
        `
        *,
        category:categories(id, name),
        subcategory:subcategories(id, name)
      `,
      )
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { message: "Listing not found" },
        { status: 404 },
      );
    }

    // Run scam detection
    const result = detectScamPatterns(listing as unknown as Listing);

    // If should auto-flag, create a report
    if (shouldAutoFlag(result)) {
      await supabase.from("reports").insert({
        reporter_id: "system", // System-generated report
        listing_id: listing.id,
        reason: "scam_detection",
        description: `Auto-flagged by ScamShield AI: ${result.reasons.join("; ")}`,
        status: "pending",
      });

      // Optionally hide the listing immediately
      if (result.confidence >= 0.8) {
        await supabase
          .from("listings")
          .update({ is_active: false })
          .eq("id", listing.id);
      }
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error checking listing for scams:", error);
    return NextResponse.json(
      { message: "Failed to check listing" },
      { status: 500 },
    );
  }
}

// Batch check multiple listings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication (admin only)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch recent listings
    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select(
        `
        *,
        category:categories(id, name),
        subcategory:subcategories(id, name)
      `,
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100);

    if (listingsError) {
      return NextResponse.json(
        { message: "Failed to fetch listings" },
        { status: 500 },
      );
    }

    // Check each listing
    const results = listings.map((listing) => ({
      listing_id: listing.id,
      title: listing.title,
      result: detectScamPatterns(listing as unknown as Listing),
    }));

    // Filter suspicious listings
    const suspicious = results.filter((r) => r.result.is_suspicious);

    return NextResponse.json({
      success: true,
      total_checked: results.length,
      suspicious_count: suspicious.length,
      suspicious_listings: suspicious,
    });
  } catch (error) {
    console.error("Error batch checking listings:", error);
    return NextResponse.json(
      { message: "Failed to batch check listings" },
      { status: 500 },
    );
  }
}
