import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listingFilterSchema } from "@/lib/validations/listing";
import { boostService } from "@/lib/services/boost";
import type { Listing, PaginatedResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const filters = {
      category_id: searchParams.get("category_id") || undefined,
      subcategory_id: searchParams.get("subcategory_id") || undefined,
      min_price: searchParams.get("min_price")
        ? parseFloat(searchParams.get("min_price")!)
        : undefined,
      max_price: searchParams.get("max_price")
        ? parseFloat(searchParams.get("max_price")!)
        : undefined,
      condition: searchParams.get("condition") || undefined,
      state: searchParams.get("state") || undefined,
      area: searchParams.get("area") || undefined,
      search_query: searchParams.get("search_query") || undefined,
      sort_by: searchParams.get("sort_by") || undefined,
    };

    // Validate filters
    const validated = listingFilterSchema.safeParse(filters);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 },
      );
    }

    // Parse pagination
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build query
    let query = supabase
      .from("listings")
      .select(
        `
      *,
      user:users(id, username, avatar_url, trust_score),
      category:categories(id, name, icon),
      subcategory:subcategories(id, name),
      media:listing_media(*)
    `,
        { count: "exact" },
      )
      .eq("is_active", true);

    // Apply filters
    if (validated.data.category_id) {
      query = query.eq("category_id", validated.data.category_id);
    }
    if (validated.data.subcategory_id) {
      query = query.eq("subcategory_id", validated.data.subcategory_id);
    }
    if (validated.data.min_price !== undefined) {
      query = query.gte("price", validated.data.min_price);
    }
    if (validated.data.max_price !== undefined) {
      query = query.lte("price", validated.data.max_price);
    }
    if (validated.data.condition) {
      query = query.eq("condition", validated.data.condition);
    }
    if (validated.data.state) {
      query = query.eq("state", validated.data.state);
    }
    if (validated.data.area) {
      query = query.eq("area", validated.data.area);
    }
    if (validated.data.search_query) {
      query = query.or(
        `title.ilike.%${validated.data.search_query}%,description.ilike.%${validated.data.search_query}%`,
      );
    }

    // Apply sorting
    switch (validated.data.sort_by) {
      case "price_asc":
        query = query.order("price", { ascending: true, nullsFirst: false });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false, nullsFirst: false });
        break;
      case "date_asc":
        query = query.order("created_at", { ascending: true });
        break;
      case "date_desc":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // Apply pagination
    const start = page * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;

    if (error) throw error;

    let listings = (data as unknown as Listing[]) || [];

    // Get boosted listings for the category (Requirement 14.2, Task 34.2)
    const boostedListingIds = await boostService.getBoostedListings({
      category_id: validated.data.category_id,
    });

    // Separate boosted and non-boosted listings
    const boostedListings = listings.filter((listing) =>
      boostedListingIds.includes(listing.id),
    );
    const nonBoostedListings = listings.filter(
      (listing) => !boostedListingIds.includes(listing.id),
    );

    // Place boosted listings at the top (Requirement 14.2)
    listings = [...boostedListings, ...nonBoostedListings];

    const response: PaginatedResponse<Listing> = {
      data: listings,
      total: count || 0,
      page,
      limit,
      hasMore: count ? start + limit < count : false,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 },
    );
  }
}
