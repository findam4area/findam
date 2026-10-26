import Typesense from "typesense";

// Initialize Typesense client
export const searchClient = new Typesense.Client({
  nodes: [
    {
      host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || "localhost",
      port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT || "8108"),
      protocol: (process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || "http") as
        | "http"
        | "https",
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY || "",
  connectionTimeoutSeconds: 2,
});

// Listings collection schema
export const listingsCollectionSchema = {
  name: "listings",
  fields: [
    { name: "id", type: "string" as const },
    { name: "title", type: "string" as const },
    { name: "description", type: "string" as const },
    { name: "category", type: "string" as const, facet: true },
    {
      name: "subcategory",
      type: "string" as const,
      facet: true,
      optional: true,
    },
    { name: "category_id", type: "string" as const, facet: true },
    {
      name: "subcategory_id",
      type: "string" as const,
      facet: true,
      optional: true,
    },
    { name: "state", type: "string" as const, facet: true },
    { name: "lga", type: "string" as const, facet: true, optional: true },
    { name: "condition", type: "string" as const, facet: true, optional: true },
    { name: "price", type: "float" as const, facet: true, optional: true },
    { name: "is_active", type: "bool" as const, facet: true },
    { name: "is_boosted", type: "bool" as const, facet: true },
    {
      name: "seller_badge_tier",
      type: "string" as const,
      facet: true,
      optional: true,
    },
    { name: "views_count", type: "int32" as const },
    { name: "likes_count", type: "int32" as const },
    { name: "created_at", type: "int64" as const },
    { name: "user_id", type: "string" as const },
  ],
  default_sorting_field: "created_at",
};

/**
 * Configure Typesense collection
 * This should be run once during setup
 */
export async function configureTypesenseCollection() {
  try {
    // Check if collection exists
    try {
      await searchClient.collections("listings").retrieve();
      console.log("Listings collection already exists");
    } catch (error: any) {
      if (error.httpStatus === 404) {
        // Collection doesn't exist, create it
        await searchClient.collections().create(listingsCollectionSchema);
        console.log("Typesense listings collection created successfully");
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Error configuring Typesense collection:", error);
    throw error;
  }
}

/**
 * Get listings collection
 */
export function getListingsCollection() {
  return searchClient.collections<any>("listings");
}
