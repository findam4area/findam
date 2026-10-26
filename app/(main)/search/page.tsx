"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessSearchBar } from "@/components/search/BusinessSearchBar";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResults } from "@/components/search/SearchResults";
import type { BusinessSearchFilters, BusinessProfile } from "@/lib/types/business-profile";

interface SearchResponse {
  businesses: (BusinessProfile & { distance_km?: number })[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  search_metadata: {
    query_time_ms: number;
    total_results: number;
    using_vector_search: boolean;
  };
}

/**
 * Business Search Results Page
 * 
 * Features:
 * - BusinessSearchBar integration with autocomplete
 * - SearchFilters sidebar with all filter options
 * - SearchResults grid display
 * - URL query params for deep linking
 * - Filter state management
 * - API integration with GET /api/search/businesses
 * 
 * Requirements: 4.1, 4.3, 6.1, 7.1, 8.1
 */
function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<BusinessSearchFilters>({});
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Parse filters from URL query parameters
   */
  const parseFiltersFromUrl = useCallback((): BusinessSearchFilters => {
    const parsedFilters: BusinessSearchFilters = {};

    // Text query
    const query = searchParams.get("q") || searchParams.get("query");
    if (query) parsedFilters.query = query;

    // Category filters
    const categoryId = searchParams.get("category_id");
    if (categoryId) parsedFilters.category_id = categoryId;

    const subcategoryId = searchParams.get("subcategory_id");
    if (subcategoryId) parsedFilters.subcategory_id = subcategoryId;

    // Location filters
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radiusKm = searchParams.get("radius_km");
    if (lat && lng && radiusKm) {
      parsedFilters.location = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius_km: parseInt(radiusKm) as 5 | 10 | 25 | 50 | 80,
      };
    }

    const city = searchParams.get("city");
    if (city) parsedFilters.city = city;

    const state = searchParams.get("state");
    if (state) parsedFilters.state = state;

    // Rating filter
    const minRating = searchParams.get("min_rating");
    if (minRating) {
      parsedFilters.min_rating = parseFloat(minRating) as 3.0 | 3.5 | 4.0 | 4.5 | 5.0;
    }

    // Price range filter
    const priceRange = searchParams.get("price_range");
    if (priceRange) {
      parsedFilters.price_range = priceRange as "$" | "$$" | "$$$" | "$$$$";
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
      parsedFilters.service_attributes = serviceAttrs;
    }

    // Sort by
    const sortBy = searchParams.get("sort_by");
    if (sortBy) {
      parsedFilters.sort_by = sortBy as BusinessSearchFilters["sort_by"];
    }

    // Boolean filters
    if (searchParams.get("only_verified") === "true") {
      parsedFilters.only_verified = true;
    }
    if (searchParams.get("only_premium") === "true") {
      parsedFilters.only_premium = true;
    }

    return parsedFilters;
  }, [searchParams]);

  /**
   * Update URL with current filters
   */
  const updateUrl = useCallback((newFilters: BusinessSearchFilters, page: number = 1) => {
    const params = new URLSearchParams();

    // Add all filters to URL
    if (newFilters.query) params.set("q", newFilters.query);
    if (newFilters.category_id) params.set("category_id", newFilters.category_id);
    if (newFilters.subcategory_id) params.set("subcategory_id", newFilters.subcategory_id);

    if (newFilters.location) {
      params.set("lat", newFilters.location.lat.toString());
      params.set("lng", newFilters.location.lng.toString());
      params.set("radius_km", newFilters.location.radius_km.toString());
    }

    if (newFilters.city) params.set("city", newFilters.city);
    if (newFilters.state) params.set("state", newFilters.state);
    if (newFilters.min_rating) params.set("min_rating", newFilters.min_rating.toString());
    if (newFilters.price_range) params.set("price_range", newFilters.price_range);

    if (newFilters.service_attributes) {
      Object.entries(newFilters.service_attributes).forEach(([key, value]) => {
        if (value) params.set(key, "true");
      });
    }

    if (newFilters.sort_by) params.set("sort_by", newFilters.sort_by);
    if (newFilters.only_verified) params.set("only_verified", "true");
    if (newFilters.only_premium) params.set("only_premium", "true");

    if (page > 1) params.set("page", page.toString());

    // Update URL without page reload
    const newUrl = params.toString() ? `/search?${params.toString()}` : "/search";
    router.push(newUrl, { scroll: false });
  }, [router]);

  /**
   * Fetch businesses from API
   */
  const fetchBusinesses = useCallback(async (
    searchFilters: BusinessSearchFilters,
    page: number = 1
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Add filters to API request
      if (searchFilters.query) params.set("query", searchFilters.query);
      if (searchFilters.category_id) params.set("category_id", searchFilters.category_id);
      if (searchFilters.subcategory_id) params.set("subcategory_id", searchFilters.subcategory_id);

      if (searchFilters.location) {
        params.set("lat", searchFilters.location.lat.toString());
        params.set("lng", searchFilters.location.lng.toString());
        params.set("radius_km", searchFilters.location.radius_km.toString());
      }

      if (searchFilters.city) params.set("city", searchFilters.city);
      if (searchFilters.state) params.set("state", searchFilters.state);
      if (searchFilters.min_rating) params.set("min_rating", searchFilters.min_rating.toString());
      if (searchFilters.price_range) params.set("price_range", searchFilters.price_range);

      if (searchFilters.service_attributes) {
        Object.entries(searchFilters.service_attributes).forEach(([key, value]) => {
          if (value) params.set(key, "true");
        });
      }

      if (searchFilters.sort_by) params.set("sort_by", searchFilters.sort_by);
      if (searchFilters.only_verified) params.set("only_verified", "true");
      if (searchFilters.only_premium) params.set("only_premium", "true");

      params.set("page", page.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/search/businesses?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch businesses");
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "An error occurred while searching");
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialize filters from URL on mount
   */
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl();
    const urlPage = parseInt(searchParams.get("page") || "1");
    
    setFilters(urlFilters);
    setCurrentPage(urlPage);

    // Only fetch if there are filters or a query
    if (Object.keys(urlFilters).length > 0) {
      fetchBusinesses(urlFilters, urlPage);
    }
  }, [searchParams, parseFiltersFromUrl, fetchBusinesses]);

  /**
   * Handle search from BusinessSearchBar
   */
  const handleSearch = (query: string) => {
    const newFilters: BusinessSearchFilters = {
      ...filters,
      query: query.trim() || undefined,
    };
    setFilters(newFilters);
    setCurrentPage(1);
    updateUrl(newFilters, 1);
    fetchBusinesses(newFilters, 1);
  };

  /**
   * Handle filter changes from SearchFilters
   */
  const handleFiltersChange = (newFilters: BusinessSearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    updateUrl(newFilters, 1);
    fetchBusinesses(newFilters, 1);
  };

  /**
   * Handle page change from SearchResults
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl(filters, page);
    fetchBusinesses(filters, page);
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">
              Search Businesses
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden border-dark-border"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>
          </div>

          {/* Search Bar */}
          <BusinessSearchBar
            defaultValue={filters.query}
            onSearch={handleSearch}
            placeholder="Search businesses, categories, or locations..."
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside
            className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}
          >
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClose={() => setShowFilters(false)}
              isOpen={showFilters}
            />
          </aside>

          {/* Search Results */}
          <main className="lg:col-span-3">
            {searchResults && (
              <SearchResults
                businesses={searchResults.businesses}
                total={searchResults.total}
                page={searchResults.page}
                limit={searchResults.limit}
                hasMore={searchResults.hasMore}
                searchMetadata={searchResults.search_metadata}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            )}

            {/* Initial State - No Search Yet */}
            {!searchResults && !isLoading && !error && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="bg-dark-card border border-dark-border rounded-xl p-12 max-w-md">
                  <SlidersHorizontal className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Start Your Search
                  </h3>
                  <p className="text-gray-400">
                    Enter a search term or apply filters to find businesses in your
                    area.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Search Page Component with Suspense Boundary
 */
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dark-bg flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
