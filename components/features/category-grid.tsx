"use client";

/**
 * CategoryGrid Component
 * 
 * A client component that displays a grid of categories with:
 * - Client-side filtering by search query (name and description)
 * - Client-side sorting (alphabetical, listing count, recently updated)
 * - Loading, error, and empty states
 * - Responsive grid layout with animations
 * 
 * Requirements: 1.2, 1.3, 2.2, 2.3, 2.4, 3.3, 3.4, 3.5, 3.6, 3.7, 13.5
 */

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import type { Category } from "@/lib/types/core";
import { CategoryCard } from "@/components/features/category-card";
import { EmptyState, EmptyStateVariants } from "@/components/shared/empty-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

// Task 22.3: Code-split CategoryPreviewPopover for better performance
// This component is only needed on desktop hover, so we dynamically import it
const CategoryPreviewPopover = dynamic(
  () => import("@/components/features/category-preview-popover").then(mod => ({ default: mod.CategoryPreviewPopover })),
  {
    ssr: false, // Desktop-only feature, no need for SSR
    loading: () => null, // No loading state needed
  }
);

export interface CategoryGridProps {
  /** Array of categories to display */
  categories: Category[];
  /** Initial search query */
  initialSearch?: string;
  /** Initial sort option */
  initialSort?: string;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Callback to retry on error */
  onRetry?: () => void;
}

/**
 * Sort options available for categories
 */
const SORT_OPTIONS = [
  { value: "alphabetical-asc", label: "A-Z" },
  { value: "alphabetical-desc", label: "Z-A" },
  { value: "most-listings", label: "Most Listings" },
  { value: "fewest-listings", label: "Fewest Listings" },
  { value: "recently-updated", label: "Recently Updated" },
] as const;

export function CategoryGrid({
  categories,
  initialSearch = "",
  initialSort = "alphabetical-asc",
  isLoading = false,
  error = null,
  onRetry,
}: CategoryGridProps) {
  // State for search query
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // State for sort option
  const [sortOption, setSortOption] = useState(initialSort);

  // Sync with initial values when they change
  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setSortOption(initialSort);
  }, [initialSort]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  // Clear search and reset to show all categories
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Memoized filtered and sorted categories for performance
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    // Filter by search query (case-insensitive, search name and description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (category) =>
          category.name.toLowerCase().includes(query) ||
          (category.description && category.description.toLowerCase().includes(query))
      );
    }

    // Sort categories based on selected option
    result.sort((a, b) => {
      switch (sortOption) {
        case "alphabetical-asc":
          return a.name.localeCompare(b.name);
        case "alphabetical-desc":
          return b.name.localeCompare(a.name);
        case "most-listings":
          return (b.listing_count || 0) - (a.listing_count || 0);
        case "fewest-listings":
          return (a.listing_count || 0) - (b.listing_count || 0);
        case "recently-updated":
          // Handle null/undefined updated_at - treat as older
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        default:
          return 0;
      }
    });

    return result;
  }, [categories, searchQuery, sortOption]);

  // Determine empty state type
  const getEmptyState = () => {
    if (error) {
      return (
        <EmptyStateVariants.Error
          onRetry={onRetry}
        />
      );
    }

    if (categories.length === 0) {
      return <EmptyStateVariants.NoData entityName="categories" />;
    }

    if (searchQuery && filteredCategories.length === 0) {
      return (
        <EmptyStateVariants.NoSearchResults
          searchTerm={searchQuery}
          onClear={handleClearSearch}
        />
      );
    }

    // Filter returned no results (but we have categories)
    if (filteredCategories.length === 0) {
      return (
        <EmptyStateVariants.NoFilterResults
          onClear={handleClearSearch}
        />
      );
    }

    return null;
  };

  const emptyState = getEmptyState();

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Search and Sort Controls Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-10 bg-gray-800/50 rounded-lg w-full sm:w-64 animate-pulse" />
          <div className="h-10 bg-gray-800/50 rounded-lg w-full sm:w-48 animate-pulse" />
        </div>

        {/* Loading Grid */}
        <LoadingSkeleton count={8} layout="grid" />
      </div>
    );
  }

  // Show empty state
  if (emptyState) {
    return (
      <div className="space-y-6">
        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-10 px-4 pl-10 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              aria-label="Search categories"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Sort Select */}
          <select
            value={sortOption}
            onChange={handleSortChange}
            className="h-10 px-4 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
            aria-label="Sort categories"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Empty State */}
        {emptyState}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full h-10 px-4 pl-10 bg-gray-900/50 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            aria-label="Search categories"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Sort Select */}
        <select
          value={sortOption}
          onChange={handleSortChange}
          className="h-10 px-4 bg-gray-900/50 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
          aria-label="Sort categories"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results count - Requirement 9.6: Live region for dynamic updates */}
      {searchQuery && (
        <div 
          className="text-sm text-gray-400"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Showing {filteredCategories.length} of {categories.length} categories
        </div>
      )}

      {/* Categories Grid - Requirement 9.5: Semantic structure with role and aria-label */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        role="list"
        aria-label="Categories grid"
      >
        {filteredCategories.map((category, index) => (
          <div key={category.id} role="listitem">
            <CategoryPreviewPopover category={category}>
              <CategoryCard category={category} index={index} />
            </CategoryPreviewPopover>
          </div>
        ))}
      </div>
    </div>
  );
}