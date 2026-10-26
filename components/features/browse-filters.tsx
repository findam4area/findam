/**
 * BrowseFilters Component (Client Component)
 * 
 * Provides filtering controls for the browse page:
 * - Category dropdown
 * - City input/dropdown
 * - Search query input
 * - Sort options (newest, featured)
 * 
 * Updates URL params on filter change for sharing/bookmarking
 * Mobile: Filters collapse to modal
 * Desktop: Sidebar filters
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, 6.9, 6.10, 6.11
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Category } from '@/lib/types/core';
import { Filter, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrowseFiltersProps {
  categories: Category[];
  cities: readonly string[];
  initialFilters: {
    category_id?: string;
    location_city?: string;
    search_query?: string;
    sort_by?: 'newest' | 'featured';
  };
  activeFiltersCount: number;
}

export function BrowseFilters({
  categories,
  cities,
  initialFilters,
  activeFiltersCount,
}: BrowseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Mobile modal state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Local state for form inputs
  const [categoryId, setCategoryId] = useState(initialFilters.category_id || '');
  const [locationCity, setLocationCity] = useState(initialFilters.location_city || '');
  const [searchQuery, setSearchQuery] = useState(initialFilters.search_query || '');
  const [sortBy, setSortBy] = useState<'newest' | 'featured'>(initialFilters.sort_by || 'newest');

  /**
   * Update URL with new filter parameters
   * Requirement 6.10: Persist filter state in URL
   */
  const updateFilters = () => {
    const params = new URLSearchParams();

    if (categoryId) params.set('category_id', categoryId);
    if (locationCity) params.set('location_city', locationCity);
    if (searchQuery) params.set('search_query', searchQuery);
    if (sortBy !== 'newest') params.set('sort_by', sortBy);
    // Reset offset when filters change
    params.set('offset', '0');

    startTransition(() => {
      router.push(`/browse?${params.toString()}`);
    });

    // Close mobile filter modal
    setIsMobileFilterOpen(false);
  };

  /**
   * Clear all filters
   * Requirement 6.7: Clear filters button
   */
  const clearFilters = () => {
    setCategoryId('');
    setLocationCity('');
    setSearchQuery('');
    setSortBy('newest');
    
    startTransition(() => {
      router.push('/browse');
    });

    setIsMobileFilterOpen(false);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters();
  };

  /**
   * Handle keyboard navigation
   * Requirement 6.9: Support keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter key
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      updateFilters();
    }
  };

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Open filters"
        >
          <Filter className="w-5 h-5" />
          <span className="font-medium">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary-500 text-white text-sm rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      <div
        className={cn(
          // Mobile: Full-screen modal
          'fixed inset-0 z-50 bg-gray-950 overflow-y-auto lg:relative lg:z-auto lg:overflow-visible',
          // Desktop: Always visible
          'lg:block',
          // Mobile: Hidden by default, shown when modal open
          isMobileFilterOpen ? 'block' : 'hidden'
        )}
      >
        {/* Mobile: Modal Header */}
        <div className="lg:hidden sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Filters</h2>
          <button
            onClick={() => setIsMobileFilterOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
            aria-label="Close filters"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Filter Form */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6"
        >
          {/* Desktop: Header */}
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-white mb-1">Filters</h2>
            <p className="text-sm text-gray-400">Refine your search results</p>
          </div>

          {/* Search Query */}
          <div>
            <label htmlFor="search_query" className="block text-sm font-medium text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                id="search_query"
                name="search_query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search listings..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                maxLength={100}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              id="category_id"
              name="category_id"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.listing_count})
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label htmlFor="location_city" className="block text-sm font-medium text-gray-300 mb-2">
              City
            </label>
            <select
              id="location_city"
              name="location_city"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label htmlFor="sort_by" className="block text-sm font-medium text-gray-300 mb-2">
              Sort By
            </label>
            <select
              id="sort_by"
              name="sort_by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'featured')}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="newest">Newest First</option>
              <option value="featured">Featured First</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-gray-800">
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                'w-full px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isPending ? 'Applying...' : 'Apply Filters'}
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                disabled={isPending}
                className={cn(
                  'w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-900',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </form>

        {/* Mobile: Bottom padding */}
        <div className="lg:hidden h-20" />
      </div>

      {/* Mobile: Backdrop */}
      {isMobileFilterOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileFilterOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
