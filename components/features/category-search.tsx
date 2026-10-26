"use client";

/**
 * CategorySearch Component
 * 
 * Search input for filtering categories with:
 * - Search icon and clear button
 * - Debounced search (300ms delay)
 * - URL query parameter updates
 * - Sticky positioning on mobile
 * - Glassmorphism styling
 * - Accessibility support
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 8.5
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategorySearchProps {
  initialSearch?: string;
  className?: string;
  placeholder?: string;
}

export function CategorySearch({
  initialSearch = '',
  className,
  placeholder = 'Search categories...',
}: CategorySearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize with URL param or prop
  const [query, setQuery] = useState(initialSearch);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Sync with URL param when it changes externally
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== query) {
      setQuery(urlSearch);
    }
  }, [searchParams]);

  /**
   * Debounced search with 300ms delay
   * Updates URL query params
   */
  useEffect(() => {
    // Skip if query matches current URL param (initial load)
    const currentUrlSearch = searchParams.get('search') || '';
    if (query === currentUrlSearch && query === initialSearch) {
      return;
    }

    setIsDebouncing(true);

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (query.trim()) {
        params.set('search', query.trim());
      } else {
        params.delete('search');
      }

      // Preserve other params (sort, show_only, etc.)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      setIsDebouncing(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams, initialSearch]);

  /**
   * Handle input change
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  /**
   * Clear search input
   */
  const handleClear = useCallback(() => {
    setQuery('');
    // Focus the input after clearing
    document.getElementById('category-search-input')?.focus();
  }, []);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Clear on Escape key
    if (e.key === 'Escape' && query) {
      e.preventDefault();
      handleClear();
    }
  }, [query, handleClear]);

  // Determine if clear button should be visible
  const showClearButton = query.length > 0;

  return (
    <div
      className={cn(
        // Sticky on mobile - Requirement 8.5
        'sticky top-0 z-50',
        'w-full',
        className
      )}
    >
      {/* Glassmorphism background - Requirement 8.5 */}
      <div className="relative">
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 -z-10" />
        
        {/* Search input container */}
        <div className="relative w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="relative max-w-2xl mx-auto">
            {/* Search icon */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search 
                className={cn(
                  'w-5 h-5 transition-colors duration-200',
                  query ? 'text-primary-400' : 'text-gray-500'
                )} 
                aria-hidden="true" 
              />
            </div>

            {/* Input field */}
            <input
              id="category-search-input"
              type="search"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                // Base styles
                'w-full pl-12 pr-12 py-3',
                'bg-gray-800/80 backdrop-blur-sm',
                'border border-gray-700 rounded-xl',
                'text-white placeholder-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50',
                'transition-all duration-200',
                // Glassmorphism effect
                'shadow-lg shadow-black/20',
                // Mobile: larger touch target - Requirement 8.2
                'min-h-[48px]',
                // Debouncing indicator
                isDebouncing && 'opacity-70'
              )}
              aria-label="Search categories"
              aria-describedby="search-description"
              role="searchbox"
            />

            {/* Clear button - Requirement 2.6 */}
            {showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className={cn(
                  'absolute right-4 top-1/2 -translate-y-1/2',
                  'p-1 rounded-full',
                  'text-gray-400 hover:text-white hover:bg-gray-700',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  'transition-all duration-200',
                  'animate-in fade-in zoom-in duration-200'
                )}
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Loading/debouncing indicator */}
            {isDebouncing && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screen reader description - Requirement 9.6 */}
      <span id="search-description" className="sr-only">
        Search categories by name or description. Results will filter automatically after typing.
      </span>
    </div>
  );
}