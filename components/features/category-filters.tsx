"use client";

/**
 * CategoryFilters Component
 * 
 * Filter controls for the categories browse page with:
 * - Sort dropdown (5 options)
 * - Top-level only checkbox filter
 * - Has listings checkbox filter
 * - URL query parameter updates
 * - Mobile responsive layout (vertical stack)
 * - Glassmorphism styling
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 8.1
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SlidersHorizontal, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortOption = 
  | 'alphabetical-asc' 
  | 'alphabetical-desc' 
  | 'most-listings' 
  | 'fewest-listings' 
  | 'recently-updated';

export type ShowOnlyOption = 'top_level' | 'has_listings';

interface CategoryFiltersProps {
  initialSort?: string;
  initialShowOnly?: string;
  className?: string;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'alphabetical-asc', label: 'Alphabetical (A-Z)' },
  { value: 'alphabetical-desc', label: 'Alphabetical (Z-A)' },
  { value: 'most-listings', label: 'Most Listings' },
  { value: 'fewest-listings', label: 'Fewest Listings' },
  { value: 'recently-updated', label: 'Recently Updated' },
];

export function CategoryFilters({
  initialSort,
  initialShowOnly,
  className,
}: CategoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL params or props
  const [sort, setSort] = useState<SortOption>(
    (initialSort as SortOption) || 'alphabetical-asc'
  );
  const [showOnly, setShowOnly] = useState<ShowOnlyOption | null>(
    (initialShowOnly as ShowOnlyOption) || null
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync with URL params when they change externally (e.g., browser back/forward)
  useEffect(() => {
    const urlSort = searchParams.get('sort') as SortOption | null;
    const urlShowOnly = searchParams.get('show_only') as ShowOnlyOption | null;

    // Only update local state if URL differs (prevents infinite loops)
    if (urlSort && urlSort !== sort) {
      setSort(urlSort);
    }
    if (urlShowOnly !== showOnly) {
      setShowOnly(urlShowOnly || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Determine if any filters are active
  const hasActiveFilters = useMemo(() => {
    return sort !== 'alphabetical-asc' || showOnly !== null;
  }, [sort, showOnly]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sort !== 'alphabetical-asc') count++;
    if (showOnly) count++;
    return count;
  }, [sort, showOnly]);

  /**
   * Update URL with new filter parameters
   * Preserves all existing params when updating individual params
   */
  const updateURL = useCallback((newSort: SortOption, newShowOnly: ShowOnlyOption | null) => {
    setIsUpdating(true);

    const params = new URLSearchParams(searchParams.toString());

    // Update sort param
    if (newSort && newSort !== 'alphabetical-asc') {
      params.set('sort', newSort);
    } else {
      params.delete('sort');
    }

    // Update show_only param
    if (newShowOnly) {
      params.set('show_only', newShowOnly);
    } else {
      params.delete('show_only');
    }

    // Use replace to avoid polluting browser history
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

    // Small delay to prevent UI flicker
    setTimeout(() => setIsUpdating(false), 150);
  }, [pathname, router, searchParams]);

  /**
   * Handle sort change
   */
  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value as SortOption;
    setSort(newSort);
    updateURL(newSort, showOnly);
  }, [showOnly, updateURL]);

  /**
   * Toggle show_only filter
   * For checkboxes, we allow multiple selections via a different approach
   * But for simplicity, we'll use radio-style behavior for now
   */
  const handleTopLevelToggle = useCallback(() => {
    const newValue: ShowOnlyOption | null = showOnly === 'top_level' ? null : 'top_level';
    setShowOnly(newValue);
    updateURL(sort, newValue);
  }, [sort, showOnly, updateURL]);

  const handleHasListingsToggle = useCallback(() => {
    const newValue: ShowOnlyOption | null = showOnly === 'has_listings' ? null : 'has_listings';
    setShowOnly(newValue);
    updateURL(sort, newValue);
  }, [sort, showOnly, updateURL]);

  return (
    <div
      className={cn(
        'w-full',
        className
      )}
    >
      {/* Glassmorphism container - Requirements 3.7, 8.1 */}
      <div className="relative">
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm border-b border-gray-800 -z-10" />
        
        {/* Filters container */}
        <div className="px-4 py-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Mobile: Vertical stack (Requirement 3.6) */}
            <div className="flex flex-col gap-4">
              
              {/* Header with filter count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-gray-400" aria-hidden="true" />
                  <span className="text-sm font-medium text-gray-300">
                    Filters
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-medium rounded-full">
                      {activeFilterCount} active
                    </span>
                  )}
                </div>
              </div>

              {/* Sort dropdown - Requirement 3.1 */}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <label 
                  htmlFor="category-sort" 
                  className="text-sm text-gray-400 shrink-0"
                >
                  Sort by:
                </label>
                <div className="relative">
                  <select
                    id="category-sort"
                    value={sort}
                    onChange={handleSortChange}
                    disabled={isUpdating}
                    className={cn(
                      // Base styles
                      'w-full sm:w-64 pl-4 pr-10 py-2.5',
                      'bg-gray-800/80 backdrop-blur-sm',
                      'border border-gray-700 rounded-lg',
                      'text-white appearance-none cursor-pointer',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50',
                      'transition-all duration-200',
                      // Disabled state
                      isUpdating && 'opacity-50 cursor-wait'
                    )}
                    aria-label="Sort categories"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  
                  {/* Custom dropdown arrow */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
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

              {/* Checkbox filters - Requirements 3.2, 3.3 */}
              <div className="flex flex-wrap gap-4">
                {/* Top-level only checkbox */}
                <label
                  htmlFor="filter-top-level"
                  className={cn(
                    'flex items-center gap-2.5 cursor-pointer',
                    'group select-none'
                  )}
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="filter-top-level"
                      checked={showOnly === 'top_level'}
                      onChange={handleTopLevelToggle}
                      disabled={isUpdating}
                      className="sr-only peer"
                    />
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 transition-all duration-200',
                        'flex items-center justify-center',
                        showOnly === 'top_level'
                          ? 'bg-primary-500 border-primary-500'
                          : 'bg-transparent border-gray-600 group-hover:border-gray-500',
                        isUpdating && 'opacity-50 cursor-wait'
                      )}
                      aria-hidden="true"
                    >
                      {showOnly === 'top_level' && (
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm transition-colors duration-200',
                    showOnly === 'top_level' ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                  )}>
                    Top-level only
                  </span>
                </label>

                {/* Has listings checkbox */}
                <label
                  htmlFor="filter-has-listings"
                  className={cn(
                    'flex items-center gap-2.5 cursor-pointer',
                    'group select-none'
                  )}
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="filter-has-listings"
                      checked={showOnly === 'has_listings'}
                      onChange={handleHasListingsToggle}
                      disabled={isUpdating}
                      className="sr-only peer"
                    />
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 transition-all duration-200',
                        'flex items-center justify-center',
                        showOnly === 'has_listings'
                          ? 'bg-primary-500 border-primary-500'
                          : 'bg-transparent border-gray-600 group-hover:border-gray-500',
                        isUpdating && 'opacity-50 cursor-wait'
                      )}
                      aria-hidden="true"
                    >
                      {showOnly === 'has_listings' && (
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    'text-sm transition-colors duration-200',
                    showOnly === 'has_listings' ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                  )}>
                    Has listings
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screen reader announcement for filter changes - Requirement 9.6 */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {isUpdating ? 'Updating filters...' : `${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
      </span>
    </div>
  );
}