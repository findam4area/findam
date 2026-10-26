import { getListingsCollection } from "./client";
import type { ListingFilters } from "@/lib/types";

export interface TypesenseParams {
  query: string;
  filters?: ListingFilters;
  sort?:
    | "price_asc"
    | "price_desc"
    | "newest"
    | "oldest"
    | "popular"
    | "relevance";
  limit?: number;
  offset?: number;
}

/**
 * Search listings using Typesense with filters and sorting
 */
export async function searchListings(params: TypesenseParams) {
  const { query, filters = {}, sort, limit = 20, offset = 0 } = params;

  try {
    // Build filter string for Typesense
    const filterConditions: string[] = ["is_active:=true"];

    // Category filter
    if (filters.category_id) {
      filterConditions.push(`category_id:=${filters.category_id}`);
    }

    // Subcategory filter
    if (filters.subcategory_id) {
      filterConditions.push(`subcategory_id:=${filters.subcategory_id}`);
    }

    // State filter
    if (filters.state) {
      filterConditions.push(`state:=${filters.state}`);
    }

    // LGA filter
    if (filters.lga) {
      filterConditions.push(`lga:=${filters.lga}`);
    }

    // Condition filter
    if (filters.condition) {
      filterConditions.push(`condition:=${filters.condition}`);
    }

    // Price range filter
    if (filters.min_price !== undefined || filters.max_price !== undefined) {
      if (filters.min_price !== undefined && filters.max_price !== undefined) {
        filterConditions.push(
          `price:[${filters.min_price}..${filters.max_price}]`,
        );
      } else if (filters.min_price !== undefined) {
        filterConditions.push(`price:>=${filters.min_price}`);
      } else if (filters.max_price !== undefined) {
        filterConditions.push(`price:<=${filters.max_price}`);
      }
    }

    // Build sort string
    let sortBy = "created_at:desc"; // Default sort

    if (sort) {
      switch (sort) {
        case "price_asc":
          sortBy = "price:asc";
          break;
        case "price_desc":
          sortBy = "price:desc";
          break;
        case "newest":
          sortBy = "created_at:desc";
          break;
        case "oldest":
          sortBy = "created_at:asc";
          break;
        case "popular":
          sortBy = "views_count:desc,likes_count:desc";
          break;
        case "relevance":
          // Default Typesense relevance ranking
          sortBy = "_text_match:desc,created_at:desc";
          break;
      }
    }

    // Prioritize boosted and verified sellers
    sortBy = `is_boosted:desc,seller_badge_tier:desc,${sortBy}`;

    // Perform search
    const searchParameters = {
      q: query || "*",
      query_by: "title,description,category,subcategory,state,lga",
      filter_by: filterConditions.join(" && "),
      sort_by: sortBy,
      per_page: limit,
      page: Math.floor(offset / limit) + 1,
    };

    const collection = getListingsCollection();
    const searchResults = await collection.documents().search(searchParameters);

    return {
      hits: searchResults.hits?.map((hit: any) => hit.document) || [],
      estimatedTotalHits: searchResults.found || 0,
      query,
      limit,
      offset,
      processingTimeMs: searchResults.search_time_ms || 0,
    };
  } catch (error) {
    console.error("Typesense search error:", error);
    throw error;
  }
}

/**
 * Get autocomplete suggestions from Typesense
 */
export async function getAutocompleteSuggestions(query: string, limit = 10) {
  try {
    const collection = getListingsCollection();
    const searchResults = await collection.documents().search({
      q: query,
      query_by: "title,category,subcategory",
      filter_by: "is_active:=true",
      per_page: limit,
      prefix: true, // Enable prefix search for autocomplete
    });

    return (searchResults.hits || []).map((hit: any) => ({
      id: hit.document.id,
      title: hit.document.title,
      category: hit.document.category,
    }));
  } catch (error) {
    console.error("Typesense autocomplete error:", error);
    return [];
  }
}
