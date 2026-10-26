/**
 * Business Search API Endpoint
 * 
 * GET /api/search/businesses
 * 
 * Requirements: 4.1, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 
 *               7.1, 7.2, 7.3, 7.5, 7.6, 8.1, 8.2, 8.3, 8.5
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  calculateSearchScore, 
  rankSearchResults,
  type ScoringParams 
} from "@/lib/utils/search-ranking";
import { 
  buildPostGISRadiusQuery, 
  buildPostGISDistanceQuery,
  isValidRadius,
  type RadiusKm
} from "@/lib/utils/distance-calculator";
import { BusinessSearchFilters } from "@/lib/types/business-profile";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const supabase = await createClient();

    // Parse search filters from query parameters
    const filters: BusinessSearchFilters = parseFilters(searchParams);
    
    // Parse pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Build the query
    let query = supabase
      .from("business_profiles")
      .select(
        `
        id,
        business_name,
        display_name,
        description,
        business_type,
        primary_category_id,
        primary_subcategory_ids,
        city,
        state,
        postal_code,
        coordinates,
        phone,
        email,
        website,
        service_attributes,
        price_range,
        primary_photo_url,
        is_verified,
        verified_at,
        is_premium,
        premium_tier,
        is_active,
        average_rating,
        review_count,
        view_count,
        created_at,
        updated_at,
        primary_category:categories!business_profiles_primary_category_id_fkey(
          id,
          name,
          icon
        )
      `,
        { count: "exact" }
      )
      .eq("is_active", true);

    // Apply text search filter
    let textRelevanceMap = new Map<string, number>();
    if (filters.query && filters.query.trim().length >= 3) {
      const searchQuery = filters.query.trim();
      
      // Use PostgreSQL full-text search with ts_rank for relevance scoring
      // The search_vector is auto-maintained by database trigger
      const { data: searchResults, error: searchError } = await (supabase.rpc as any)(
        "search_businesses_fts",
        {
          search_query: searchQuery,
          p_limit: 1000, // Get more results for ranking
        }
      );

      if (searchError) {
        console.error("Full-text search error:", searchError);
        throw searchError;
      }

      if (searchResults && Array.isArray(searchResults)) {
        // Store relevance scores for ranking
        searchResults.forEach((result: any) => {
          textRelevanceMap.set(result.id, result.rank);
        });

        // Filter to only businesses that matched the search
        const matchingIds = searchResults.map((r: any) => r.id);
        if (matchingIds.length === 0) {
          // No results found
          return NextResponse.json({
            businesses: [],
            total: 0,
            page,
            limit,
            hasMore: false,
            search_metadata: {
              query_time_ms: Date.now() - startTime,
              total_results: 0,
              using_vector_search: false,
            },
          });
        }
        
        query = query.in("id", matchingIds);
      }
    }

    // Apply category filter
    let categoryMatchMap = new Map<string, { primary: boolean; secondary: boolean }>();
    if (filters.category_id) {
      // Get businesses with primary or secondary category match
      const { data: categoryMatches } = await supabase
        .from("business_category_tags")
        .select("business_profile_id, is_primary")
        .eq("category_id", filters.category_id);

      if (categoryMatches) {
        categoryMatches.forEach((match) => {
          const existing = categoryMatchMap.get(match.business_profile_id) || {
            primary: false,
            secondary: false,
          };
          if (match.is_primary) {
            existing.primary = true;
          } else {
            existing.secondary = true;
          }
          categoryMatchMap.set(match.business_profile_id, existing);
        });

        const matchingBusinessIds = Array.from(categoryMatchMap.keys());
        if (matchingBusinessIds.length > 0) {
          query = query.in("id", matchingBusinessIds);
        } else {
          // No businesses in this category
          return NextResponse.json({
            businesses: [],
            total: 0,
            page,
            limit,
            hasMore: false,
            search_metadata: {
              query_time_ms: Date.now() - startTime,
              total_results: 0,
              using_vector_search: false,
            },
          });
        }
      }
    }

    // Apply subcategory filter
    if (filters.subcategory_id) {
      // This requires checking if subcategory_id is in primary_subcategory_ids array
      query = query.contains("primary_subcategory_ids", [filters.subcategory_id]);
    }

    // Apply location filter with PostGIS
    if (filters.location) {
      const { lat, lng, radius_km } = filters.location;
      
      if (!isValidRadius(radius_km)) {
        return NextResponse.json(
          { error: `Invalid radius. Supported values: 5, 10, 25, 50, 80 km` },
          { status: 400 }
        );
      }

      // Use PostGIS ST_DWithin for efficient spatial filtering
      const radiusQuery = buildPostGISRadiusQuery(lat, lng, radius_km);
      query = query.not("coordinates", "is", null);
      // Note: Supabase client doesn't support raw SQL in filter, so we'll filter in memory
    }

    // Apply city/state filter
    if (filters.city) {
      query = query.ilike("city", filters.city);
    }
    if (filters.state) {
      query = query.ilike("state", filters.state);
    }

    // Apply rating filter
    if (filters.min_rating) {
      query = query.gte("average_rating", filters.min_rating);
    }

    // Apply price range filter
    if (filters.price_range) {
      query = query.eq("price_range", filters.price_range);
    }

    // Apply verification filter
    if (filters.only_verified) {
      query = query.eq("is_verified", true);
    }

    // Apply premium filter
    if (filters.only_premium) {
      query = query.eq("is_premium", true);
    }

    // Execute query with timeout (2 seconds)
    const queryPromise = query.range(0, 999); // Get up to 1000 for scoring
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Query timeout")), 2000)
    );

    const { data: businesses, error, count } = await Promise.race([
      queryPromise,
      timeoutPromise,
    ]) as any;

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({
        businesses: [],
        total: 0,
        page,
        limit,
        hasMore: false,
        search_metadata: {
          query_time_ms: Date.now() - startTime,
          total_results: 0,
          using_vector_search: false,
        },
      });
    }

    // Apply service attributes filter (AND logic)
    let filteredBusinesses = businesses;
    if (filters.service_attributes) {
      filteredBusinesses = filteredBusinesses.filter((business: any) => {
        const attrs = business.service_attributes || {};
        
        // Check all requested attributes are present and true
        return Object.entries(filters.service_attributes!).every(
          ([key, value]) => {
            if (value === true) {
              return attrs[key] === true;
            }
            return true;
          }
        );
      });
    }

    // Apply location distance filter in memory (since Supabase client doesn't support PostGIS directly)
    if (filters.location) {
      const { lat, lng, radius_km } = filters.location;
      filteredBusinesses = filteredBusinesses.filter((business: any) => {
        if (!business.coordinates) return false;
        
        const distance = calculateDistance(
          lat,
          lng,
          business.coordinates.lat,
          business.coordinates.lng
        );
        
        return distance <= radius_km;
      });

      // Add distance to each business
      filteredBusinesses = filteredBusinesses.map((business: any) => {
        if (business.coordinates) {
          const distance = calculateDistance(
            filters.location!.lat,
            filters.location!.lng,
            business.coordinates.lat,
            business.coordinates.lng
          );
          return { ...business, distance_km: Math.round(distance * 100) / 100 };
        }
        return business;
      });
    }

    // Calculate search scores for ranking
    const scoredBusinesses = filteredBusinesses.map((business: any) => {
      const textRelevanceScore = textRelevanceMap.get(business.id) || 0;
      const categoryMatch = categoryMatchMap.get(business.id);
      
      const scoringParams: ScoringParams = {
        textRelevanceScore,
        isPrimaryCategoryMatch: categoryMatch?.primary || false,
        isSecondaryCategoryMatch: categoryMatch?.secondary || false,
        averageRating: business.average_rating,
        reviewCount: business.review_count,
        isPremium: business.is_premium,
        isVerified: business.is_verified,
        createdAt: new Date(business.created_at),
      };

      const searchScore = calculateSearchScore(scoringParams);

      return {
        ...business,
        searchScore,
      };
    });

    // Rank results using search score and tiebreakers
    const rankedBusinesses = rankSearchResults(scoredBusinesses);

    // Apply pagination
    const total = rankedBusinesses.length;
    const paginatedBusinesses = rankedBusinesses.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    // Remove searchScore from final response
    const finalBusinesses = paginatedBusinesses.map(({ searchScore, ...business }) => business);

    const queryTime = Date.now() - startTime;

    return NextResponse.json({
      businesses: finalBusinesses,
      total,
      page,
      limit,
      hasMore,
      search_metadata: {
        query_time_ms: queryTime,
        total_results: total,
        using_vector_search: false,
      },
    });

  } catch (error: any) {
    console.error("Search error:", error);
    
    if (error.message === "Query timeout") {
      return NextResponse.json(
        { error: "Search request timed out. Please refine your filters." },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: "Failed to search businesses" },
      { status: 500 }
    );
  }
}

/**
 * Parse search filters from URLSearchParams
 */
function parseFilters(searchParams: URLSearchParams): BusinessSearchFilters {
  const filters: BusinessSearchFilters = {};

  const query = searchParams.get("query");
  if (query) filters.query = query;

  const categoryId = searchParams.get("category_id");
  if (categoryId) filters.category_id = categoryId;

  const subcategoryId = searchParams.get("subcategory_id");
  if (subcategoryId) filters.subcategory_id = subcategoryId;

  // Location filter
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radiusKm = searchParams.get("radius_km");
  if (lat && lng && radiusKm) {
    filters.location = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius_km: parseInt(radiusKm) as RadiusKm,
    };
  }

  const city = searchParams.get("city");
  if (city) filters.city = city;

  const state = searchParams.get("state");
  if (state) filters.state = state;

  const minRating = searchParams.get("min_rating");
  if (minRating) {
    filters.min_rating = parseFloat(minRating) as 3.0 | 3.5 | 4.0 | 4.5 | 5.0;
  }

  const priceRange = searchParams.get("price_range");
  if (priceRange) {
    filters.price_range = priceRange as "$" | "$$" | "$$$" | "$$$$";
  }

  // Service attributes
  const serviceAttrs: BusinessSearchFilters["service_attributes"] = {};
  if (searchParams.get("delivery_available") === "true") {
    serviceAttrs.delivery_available = true;
  }
  if (searchParams.get("online_service") === "true") {
    serviceAttrs.online_service = true;
  }
  if (searchParams.get("in_person_service") === "true") {
    serviceAttrs.in_person_service = true;
  }
  if (searchParams.get("availability_24_7") === "true") {
    serviceAttrs.availability_24_7 = true;
  }
  if (searchParams.get("emergency_service") === "true") {
    serviceAttrs.emergency_service = true;
  }
  if (Object.keys(serviceAttrs).length > 0) {
    filters.service_attributes = serviceAttrs;
  }

  const sortBy = searchParams.get("sort_by");
  if (sortBy) {
    filters.sort_by = sortBy as BusinessSearchFilters["sort_by"];
  }

  const onlyVerified = searchParams.get("only_verified");
  if (onlyVerified === "true") {
    filters.only_verified = true;
  }

  const onlyPremium = searchParams.get("only_premium");
  if (onlyPremium === "true") {
    filters.only_premium = true;
  }

  return filters;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
