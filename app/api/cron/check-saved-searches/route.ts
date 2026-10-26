/**
 * GET /api/cron/check-saved-searches
 * Cron job to check for new matches and price drops for saved searches
 * Requirements: 13.3, 13.4, 13.5
 * Tasks: 42.3, 42.5
 *
 * This should run every 5 minutes for instant notifications
 * and aggregate for daily/weekly digests
 */

import { NextRequest, NextResponse } from "next/server";
import { AlertService } from "@/lib/services/alert";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get all active, non-paused saved searches
    const { data: savedSearches, error } = await (supabase.from as any)(
      "saved_searches",
    )
      .select("*")
      .eq("is_active", true)
      .eq("is_paused", false);

    if (error) {
      throw new Error(`Failed to fetch saved searches: ${error.message}`);
    }

    let totalNewMatches = 0;
    let totalPriceDrops = 0;
    let totalAlertsSent = 0;

    // Process each saved search
    for (const search of savedSearches || []) {
      try {
        // Check for new matches and price drops
        const { newMatches, priceDrops } = await AlertService.checkForMatches(
          search.id,
        );

        totalNewMatches += newMatches.length;
        totalPriceDrops += priceDrops.length;

        // Send instant notifications for instant frequency
        if (search.notification_frequency === "instant") {
          // Send alerts for new matches
          for (const listing of newMatches) {
            await AlertService.sendAlert({
              savedSearchId: search.id,
              userId: search.user_id,
              listingId: listing.id,
              alertType: "new_listing",
              listingSnapshot: {
                title: listing.title,
                price: listing.price,
                imageUrl: listing.images?.[0],
              },
              notificationMethod: "push",
            });
            totalAlertsSent++;
          }

          // Send alerts for price drops
          for (const priceDrop of priceDrops) {
            await AlertService.sendAlert({
              savedSearchId: search.id,
              userId: search.user_id,
              listingId: priceDrop.listing.id,
              alertType: "price_drop",
              previousPrice: priceDrop.previousPrice,
              newPrice: priceDrop.newPrice,
              priceDropPercentage: priceDrop.dropPercentage,
              listingSnapshot: {
                title: priceDrop.listing.title,
                price: priceDrop.newPrice,
                imageUrl: priceDrop.listing.images?.[0],
              },
              notificationMethod: "push",
            });
            totalAlertsSent++;
          }
        } else {
          // For daily/weekly digests, just create the alert records
          // They will be sent in batches by the digest cron job
          for (const listing of newMatches) {
            await AlertService.sendAlert({
              savedSearchId: search.id,
              userId: search.user_id,
              listingId: listing.id,
              alertType: "new_listing",
              listingSnapshot: {
                title: listing.title,
                price: listing.price,
                imageUrl: listing.images?.[0],
              },
              notificationMethod: "digest",
            });
          }

          for (const priceDrop of priceDrops) {
            await AlertService.sendAlert({
              savedSearchId: search.id,
              userId: search.user_id,
              listingId: priceDrop.listing.id,
              alertType: "price_drop",
              previousPrice: priceDrop.previousPrice,
              newPrice: priceDrop.newPrice,
              priceDropPercentage: priceDrop.dropPercentage,
              listingSnapshot: {
                title: priceDrop.listing.title,
                price: priceDrop.newPrice,
                imageUrl: priceDrop.listing.images?.[0],
              },
              notificationMethod: "digest",
            });
          }
        }
      } catch (searchError) {
        console.error(
          `Error processing saved search ${search.id}:`,
          searchError,
        );
        // Continue with other searches even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      searches_processed: savedSearches?.length || 0,
      new_matches: totalNewMatches,
      price_drops: totalPriceDrops,
      alerts_sent: totalAlertsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in check-saved-searches cron:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check saved searches",
      },
      { status: 500 },
    );
  }
}
