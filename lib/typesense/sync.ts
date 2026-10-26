import { getListingsCollection } from "./client";
import type { Listing } from "@/lib/types";

/**
 * Sync a listing to Typesense collection
 * Requirements: 15.9 - Prioritize verified sellers in search
 */
export async function syncListingToTypesense(
  listing: Listing,
  sellerBadgeTier?: string,
  sellerUsername?: string,
) {
  try {
    const collection = getListingsCollection();

    // Prepare document for Typesense
    const searchDocument = {
      id: listing.id,
      title: listing.title,
      description: listing.description || "",
      category: listing.category?.name || "",
      subcategory: listing.subcategory?.name || "",
      category_id: listing.category_id,
      subcategory_id: listing.subcategory_id || "",
      state: listing.state,
      lga: listing.lga || "",
      condition: listing.condition || "",
      price: listing.price || 0,
      is_active: listing.is_active,
      is_boosted: listing.is_boosted || false,
      seller_badge_tier: sellerBadgeTier || "none",
      views_count: listing.views_count || 0,
      likes_count: listing.likes_count || 0,
      created_at: new Date(listing.created_at).getTime(),
      user_id: listing.user_id,
    };

    await collection.documents().upsert(searchDocument);
    console.log(`Synced listing ${listing.id} to Typesense`);
  } catch (error) {
    console.error(`Error syncing listing ${listing.id} to Typesense:`, error);
    throw error;
  }
}

/**
 * Delete a listing from Typesense collection
 */
export async function deleteListingFromTypesense(listingId: string) {
  try {
    const collection = getListingsCollection();
    await collection.documents(listingId).delete();
    console.log(`Deleted listing ${listingId} from Typesense`);
  } catch (error) {
    console.error(`Error deleting listing ${listingId} from Typesense:`, error);
    throw error;
  }
}

/**
 * Sync multiple listings to Typesense (bulk operation)
 * Requirements: 15.9 - Prioritize verified sellers in search
 */
export async function syncListingsBulkToTypesense(
  listings: Listing[],
  sellerBadgeTiers?: Record<string, string>,
) {
  try {
    const collection = getListingsCollection();

    // Prepare documents for Typesense
    const searchDocuments = listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description || "",
      category: listing.category?.name || "",
      subcategory: listing.subcategory?.name || "",
      category_id: listing.category_id,
      subcategory_id: listing.subcategory_id || "",
      state: listing.state,
      lga: listing.lga || "",
      condition: listing.condition || "",
      price: listing.price || 0,
      is_active: listing.is_active,
      is_boosted: listing.is_boosted || false,
      seller_badge_tier: sellerBadgeTiers?.[listing.user_id] || "none",
      views_count: listing.views_count || 0,
      likes_count: listing.likes_count || 0,
      created_at: new Date(listing.created_at).getTime(),
      user_id: listing.user_id,
    }));

    await collection.documents().import(searchDocuments, { action: "upsert" });
    console.log(`Synced ${listings.length} listings to Typesense`);
  } catch (error) {
    console.error("Error syncing listings bulk to Typesense:", error);
    throw error;
  }
}
