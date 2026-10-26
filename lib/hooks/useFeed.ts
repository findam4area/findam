import { useInfiniteQuery } from "@tanstack/react-query";
import { useListingsStore } from "@/store/listings";
import { getFeedListings } from "@/lib/api/listings";
import type { ListingFilters, Listing } from "@/lib/types";

/**
 * Custom hook for feed data fetching with TanStack React Query infinite scroll
 * Implements stale-while-revalidate caching strategy
 */
export function useFeed() {
  const { filters, setFilters, resetFilters } = useListingsStore();

  /**
   * Infinite query for feed listings with cursor-based pagination
   * Uses TanStack React Query for caching and stale-while-revalidate
   */
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["feed", filters],
    queryFn: async ({ pageParam }) => {
      return await getFeedListings(pageParam, 20, filters);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes - cache persists for 30 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when reconnecting
  });

  // Flatten all pages into a single array of listings
  const listings: Listing[] = data?.pages.flatMap((page) => page.data) ?? [];

  /**
   * Load more listings (infinite scroll)
   */
  const loadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  };

  /**
   * Refresh feed (pull-to-refresh)
   */
  const refresh = async () => {
    await refetch();
  };

  /**
   * Update filters and reload feed
   */
  const updateFilters = (newFilters: Partial<ListingFilters>) => {
    setFilters(newFilters);
    // Query will automatically refetch due to queryKey change
  };

  /**
   * Clear filters and reload feed
   */
  const clearFilters = () => {
    resetFilters();
    // Query will automatically refetch due to queryKey change
  };

  return {
    listings,
    filters,
    isLoading,
    isRefreshing: isRefetching,
    hasMore: hasNextPage ?? false,
    isFetchingNextPage,
    loadMore,
    refresh,
    updateFilters,
    clearFilters,
  };
}
