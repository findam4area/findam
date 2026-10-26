import { createClient } from "@/lib/supabase/server";
import { syncListingToTypesense, deleteListingFromTypesense } from "./sync";
import type { Listing } from "@/lib/types";

/**
 * Set up real-time sync from Supabase to Typesense
 * This listens to changes in the listings table and updates Typesense accordingly
 * Requirements: 15.9 - Prioritize verified sellers in search
 */
export async function setupRealtimeSync() {
  const supabase = await createClient();

  // Subscribe to changes in the listings table
  const channel = supabase
    .channel("listings-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "listings",
      },
      async (payload) => {
        try {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            // Sync the listing to Typesense
            const listing = payload.new as Listing;

            // Fetch seller badge tier
            const { data: badge } = await supabase
              .from("verification_badges")
              .select("tier")
              .eq("user_id", listing.user_id)
              .single();

            await syncListingToTypesense(listing, badge?.tier);
          } else if (payload.eventType === "DELETE") {
            // Delete the listing from Typesense
            const listingId = payload.old.id;
            await deleteListingFromTypesense(listingId);
          }
        } catch (error) {
          console.error("Error syncing listing to Typesense:", error);
        }
      },
    )
    .subscribe();

  return channel;
}
