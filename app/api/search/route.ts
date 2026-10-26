import { NextRequest, NextResponse } from "next/server";
import { searchListings } from "@/lib/typesense/queries";
import { createClient } from "@/lib/supabase/server";
import { boostService } from "@/lib/services/boost";
import type { ListingFilters } from "@/lib/types";
import { createRateLimitMiddleware } from "@/lib/middleware/rate-limit-middleware";

// Rate limiter for search endpoint - 100 requests per minute (Requirement 31.2)
const rateLimitMiddleware = createRateLimitMiddleware({
  uniqueTokenPerInterval: 100,
  interval: 60000, // 1 minute
});

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (Requirement 31.2, 31.11)
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse; // Returns 429 if limit exceeded
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse filters from query parameters
    const filters: ListingFilters = {};

    const query = searchParams.get("q") || "";

    const categoryId = searchParams.get("category_id");
    if (categoryId && categoryId !== "all") {
      filters.category_id = categoryId;
    }

    const subcategoryId = searchParams.get("subcategory_id");
    if (subcategoryId && subcategoryId !== "all") {
      filters.subcategory_id = subcategoryId;
    }

    const minPrice = searchParams.get("min_price");
    if (minPrice) {
      filters.min_price = parseFloat(minPrice);
    }

    const maxPrice = searchParams.get("max_price");
    if (maxPrice) {
      filters.max_price = parseFloat(maxPrice);
    }

    const condition = searchParams.get("condition");
    if (
      condition &&
      condition !== "all" &&
      ["new", "used", "refurbished"].includes(condition)
    ) {
      filters.condition = condition as "new" | "used" | "refurbished";
    }

    const state = searchParams.get("state");
    if (state && state !== "all") {
      filters.state = state;
    }

    const lga = searchParams.get("lga");
    if (lga && lga !== "all") {
      filters.lga = lga;
    }

    const ward = searchParams.get("ward");
    if (ward && ward !== "all") {
      filters.ward = ward;
    }

    const sortBy = searchParams.get("sort_by");
    if (
      sortBy &&
      [
        "price_asc",
        "price_desc",
        "date_asc",
        "date_desc",
        "relevance",
      ].includes(sortBy)
    ) {
      filters.sort_by = sortBy as ListingFilters["sort_by"];
    }

    // Parse pagination
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = page * limit;

    // Search using Typesense
    const typesenseResults = await searchListings({
      query,
      filters,
      limit,
      offset,
    });

    // Get full listing details from Supabase for the results
    const supabase = await createClient();
    const listingIds = typesenseResults.hits.map((hit: any) => hit.id);

    if (listingIds.length === 0) {
      return NextResponse.json({
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      });
    }

    const { data: listings, error } = await supabase
      .from("listings")
      .select(
        `
        *,
        user:users!listings_user_id_fkey(id, username, avatar_url, trust_score),
        category:categories!listings_category_id_fkey(id, name, icon),
        subcategory:subcategories!listings_subcategory_id_fkey(id, name)
      `,
      )
      .in("id", listingIds)
      .eq("is_active", true);

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Sort listings to match Typesense order
    const sortedListings = listingIds
      .map((id) => listings?.find((listing) => listing?.id === id))
      .filter(
        (listing): listing is NonNullable<typeof listing> =>
          listing !== undefined,
      );

    // Get boosted listings for the category (Requirement 14.2, Task 34.2)
    const boostedListingIds = await boostService.getBoostedListings({
      category_id: filters.category_id,
    });

    // Separate boosted and non-boosted listings
    const boostedListings = sortedListings.filter((listing) =>
      boostedListingIds.includes(listing?.id ?? ""),
    );
    const nonBoostedListings = sortedListings.filter(
      (listing) => !boostedListingIds.includes(listing?.id ?? ""),
    );

    // Place boosted listings at the top (Requirement 14.2)
    const finalListings = [...boostedListings, ...nonBoostedListings];

    const total = typesenseResults.estimatedTotalHits;
    const hasMore = offset + limit < total;

    return NextResponse.json({
      data: finalListings,
      total,
      page,
      limit,
      hasMore,
      processingTimeMs: typesenseResults.processingTimeMs,
      boosted_count: boostedListings.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search listings" },
      { status: 500 },
    );
  }
}
