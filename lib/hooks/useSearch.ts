import { useState, useCallback, useEffect } from "react";
import type { Listing, ListingFilters, PaginatedResponse } from "@/lib/types";
import { addSearchToHistory } from "@/lib/utils/search-history";

interface AutocompleteSuggestion {
  type: "listing" | "category" | "subcategory";
  id: string;
  text: string;
  category_id?: string;
}

export function useSearch() {
  const [results, setResults] = useState<PaginatedResponse<Listing> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (filters: ListingFilters, page: number = 0) => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query parameters
        const params = new URLSearchParams();

        if (filters.search_query) {
          params.append("q", filters.search_query);
          // Add to search history
          addSearchToHistory(filters.search_query);
        }
        if (filters.category_id) {
          params.append("category_id", filters.category_id);
        }
        if (filters.subcategory_id) {
          params.append("subcategory_id", filters.subcategory_id);
        }
        if (filters.min_price !== undefined) {
          params.append("min_price", filters.min_price.toString());
        }
        if (filters.max_price !== undefined) {
          params.append("max_price", filters.max_price.toString());
        }
        if (filters.condition) {
          params.append("condition", filters.condition);
        }
        if (filters.state) {
          params.append("state", filters.state);
        }
        if (filters.lga) {
          params.append("lga", filters.lga);
        }
        if (filters.ward) {
          params.append("ward", filters.ward);
        }
        if (filters.sort_by) {
          params.append("sort_by", filters.sort_by);
        }

        params.append("page", page.toString());
        params.append("limit", "20");

        const response = await fetch(`/api/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data: PaginatedResponse<Listing> = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    results,
    isLoading,
    error,
    search,
  };
}

export function useAutocomplete() {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/search/autocomplete?q=${encodeURIComponent(query)}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error("Autocomplete error:", err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce the fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      // This will be handled by the component using this hook
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return {
    suggestions,
    isLoading,
    fetchSuggestions,
  };
}
