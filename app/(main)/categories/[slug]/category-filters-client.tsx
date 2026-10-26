/**
 * CategoryFiltersClient - Client component for category page filters
 * 
 * Provides filtering controls for:
 * - City/location search
 * - Keyword search within category
 * - Sort options (newest, featured)
 * 
 * Updates URL parameters for sharing and bookmarking
 * Requirements: 6.1
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, ArrowUpDown } from 'lucide-react';

interface CategoryFiltersClientProps {
  categoryId: string;
  categorySlug: string;
  cities: readonly string[];
  initialFilters?: {
    location_city?: string;
    search_query?: string;
    sort_by?: 'newest' | 'featured';
  };
}

export function CategoryFiltersClient({
  categoryId,
  categorySlug,
  cities,
  initialFilters = {},
}: CategoryFiltersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for form inputs
  const [locationCity, setLocationCity] = useState(initialFilters.location_city || '');
  const [searchQuery, setSearchQuery] = useState(initialFilters.search_query || '');
  const [sortBy, setSortBy] = useState<'newest' | 'featured'>(initialFilters.sort_by || 'newest');

  // Update URL with new filter parameters
  const updateFilters = (newFilters: {
    location_city?: string;
    search_query?: string;
    sort_by?: 'newest' | 'featured';
  }) => {
    const params = new URLSearchParams();

    // Add filter params
    if (newFilters.location_city) {
      params.set('location_city', newFilters.location_city);
    }
    if (newFilters.search_query) {
      params.set('search_query', newFilters.search_query);
    }
    if (newFilters.sort_by && newFilters.sort_by !== 'newest') {
      params.set('sort_by', newFilters.sort_by);
    }

    // Reset to page 1 when filters change
    const queryString = params.toString();
    const url = `/categories/${categorySlug}${queryString ? `?${queryString}` : ''}`;

    startTransition(() => {
      router.push(url);
    });
  };

  // Handle city filter change
  const handleCityChange = (city: string) => {
    setLocationCity(city);
    updateFilters({
      location_city: city || undefined,
      search_query: searchQuery || undefined,
      sort_by: sortBy,
    });
  };

  // Handle search query change
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({
      location_city: locationCity || undefined,
      search_query: searchQuery || undefined,
      sort_by: sortBy,
    });
  };

  // Handle sort change
  const handleSortChange = (newSortBy: 'newest' | 'featured') => {
    setSortBy(newSortBy);
    updateFilters({
      location_city: locationCity || undefined,
      search_query: searchQuery || undefined,
      sort_by: newSortBy,
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setLocationCity('');
    setSearchQuery('');
    setSortBy('newest');
    router.push(`/categories/${categorySlug}`);
  };

  const hasActiveFilters = locationCity || searchQuery || sortBy !== 'newest';

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 md:p-6">
      <div className="flex flex-col gap-4">
        {/* Search and City Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <label htmlFor="search-query" className="sr-only">
              Search within category
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="search-query"
                name="search_query"
                placeholder="Search within category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-10 pr-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    updateFilters({
                      location_city: locationCity || undefined,
                      search_query: undefined,
                      sort_by: sortBy,
                    });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </form>

          {/* City Filter */}
          <div className="relative">
            <label htmlFor="location-city" className="sr-only">
              Filter by city
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                id="location-city"
                name="location_city"
                value={locationCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full h-12 pl-10 pr-10 bg-gray-800 border border-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Sort and Clear Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSortChange('newest')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  sortBy === 'newest'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Newest
              </button>
              <button
                type="button"
                onClick={() => handleSortChange('featured')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  sortBy === 'featured'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Featured
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
