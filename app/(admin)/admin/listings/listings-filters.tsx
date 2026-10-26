/**
 * Admin Listings Filters Client Component
 * 
 * Provides real-time search and filter functionality for the admin listings dashboard.
 * Updates URL parameters without full page reload for better UX.
 * 
 * Features:
 * - Real-time search with debouncing
 * - Sort dropdown with instant update
 * - Active filters display
 * - Mobile-responsive design
 * 
 * Requirements: 3.3
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';

interface ListingsFiltersProps {
  totalPending: number;
  filteredCount: number;
}

/**
 * Debounce hook for search input
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Admin Listings Filters Component
 * 
 * Client component that provides interactive filtering and search.
 * Updates URL params using Next.js router for shareable filter state.
 */
export function ListingsFilters({
  totalPending,
  filteredCount,
}: ListingsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for controlled inputs
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>(
    (searchParams.get('sort') as 'newest' | 'oldest') || 'newest'
  );

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  /**
   * Update URL parameters without page reload
   */
  const updateFilters = useCallback(
    (search: string, sort: 'newest' | 'oldest') => {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (sort !== 'newest') {
        params.set('sort', sort);
      }

      const queryString = params.toString();
      const url = queryString
        ? `/admin/listings?${queryString}`
        : '/admin/listings';

      router.push(url);
    },
    [router]
  );

  /**
   * Update URL when debounced search query changes
   */
  useEffect(() => {
    if (debouncedSearchQuery !== searchParams.get('search') || '') {
      updateFilters(debouncedSearchQuery, sortOrder);
    }
  }, [debouncedSearchQuery]); // Only depend on debounced query

  /**
   * Handle sort change
   */
  const handleSortChange = (newSort: 'newest' | 'oldest') => {
    setSortOrder(newSort);
    updateFilters(searchQuery, newSort);
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchQuery('');
    setSortOrder('newest');
    router.push('/admin/listings');
  };

  /**
   * Clear search only
   */
  const clearSearch = () => {
    setSearchQuery('');
    updateFilters('', sortOrder);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || sortOrder !== 'newest';

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search input */}
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            <Search className="inline h-4 w-4 mr-1" />
            Search by title or user
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search..."
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 pr-10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-naija-green focus:border-transparent"
              aria-label="Search listings by title or user"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-dark-bg rounded-full transition-colors"
                aria-label="Clear search"
                title="Clear search"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Sort dropdown */}
        <div>
          <label
            htmlFor="sort"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            <Filter className="inline h-4 w-4 mr-1" />
            Sort by date
          </label>
          <select
            id="sort"
            value={sortOrder}
            onChange={(e) =>
              handleSortChange(e.target.value as 'newest' | 'oldest')
            }
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-naija-green focus:border-transparent cursor-pointer"
            aria-label="Sort listings by date"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400">Active filters:</span>
          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-naija-green/20 text-naija-green rounded-full text-sm">
              Search: "{searchQuery.trim()}"
              <button
                onClick={clearSearch}
                className="ml-1 hover:text-white transition-colors"
                aria-label="Clear search filter"
                title="Clear search"
              >
                ×
              </button>
            </span>
          )}
          {sortOrder !== 'newest' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-naija-green/20 text-naija-green rounded-full text-sm">
              Sort:{' '}
              {sortOrder === 'oldest' ? 'Oldest first' : 'Newest first'}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-naija-green hover:text-naija-green/80 underline transition-colors"
            aria-label="Clear all filters"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Results count */}
      {searchQuery.trim() && filteredCount !== totalPending && (
        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredCount} of {totalPending} pending listing
          {totalPending !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
