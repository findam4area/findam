import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncListingsBulkToTypesense } from "@/lib/typesense/sync";
import type { Listing } from "@/lib/types";

/**
 * API route to manually trigger a full sync of listings to Typesense
 * This should be called once during setup or when re-indexing is needed
 * Requirements: 15.9 - Prioritize verified sellers in search
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here to ensure only admins can trigger sync
    const supabase = await createClient();

    // Fetch all active listings
    const { data: listings, error } = await supabase
      .from("listings")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching listings:", error);
      throw error;
    }

    if (!listings || listings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No listings to sync",
        count: 0,
      });
    }

    // Fetch seller badge tiers for all sellers
    const sellerIds = [
      ...new Set(
        listings
          .map((l) => l.user_id)
          .filter((id): id is string => id !== null),
      ),
    ];
    const { data: badges } = await supabase
      .from("verification_badges")
      .select("user_id, tier")
      .in("user_id", sellerIds);

    // Create a map of seller_id -> badge_tier
    const sellerBadgeTiers: Record<string, string> = {};
    badges?.forEach((badge) => {
      sellerBadgeTiers[badge.user_id] = badge.tier;
    });

    // Sync all listings to Typesense in bulk
    await syncListingsBulkToTypesense(listings as Listing[], sellerBadgeTiers);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${listings.length} listings to Typesense`,
      count: listings.length,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync listings to Typesense",
      },
      { status: 500 },
    );
  }
}
