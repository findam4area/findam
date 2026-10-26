"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Search, X, Loader2, TrendingUp, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroSearchBarProps, AutocompleteResult } from "./types";

/**
 * HeroSearchBar Component
 * 
 * Prominent search bar with semantic and keyword autocomplete.
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.9
 * 
 * Features:
 * - Debounced search input (300ms delay)
 * - Hybrid search (keyword + semantic with pgvector)
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Up to 8 suggestions (listings, categories, vendors)
 * - Highlighted matching text in suggestions
 * - Focus ring and expand animation
 */

// Debounce hook
function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

// Animation variants for dropdown
const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 200, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 150, ease: "easeIn" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 50, duration: 150 },
  }),
};

// Default mock results for demonstration
const mockResults: AutocompleteResult[] = [
  {
    type: "listing",
    id: "1",
    title: "iPhone 15 Pro Max 256GB",
    subtitle: "₦850,000 • Lagos",
    thumbnail: undefined,
    url: "/listing/1",
  },
  {
    type: "category",
    id: "electronics",
    title: "Electronics",
    subtitle: "12.5K listings",
    url: "/categories/electronics",
  },
  {
    type: "vendor",
    id: "v1",
    title: "TechHub Nigeria",
    subtitle: "⭐ 4.9 • 234 listings",
    url: "/store/v1",
  },
];

// Get icon for result type
function getResultIcon(type: AutocompleteResult["type"]) {
  switch (type) {
    case "listing":
      return Package;
    case "category":
      return TrendingUp;
    case "vendor":
      return User;
    default:
      return Search;
  }
}

// Highlight matching text
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-naija-green/30 text-white rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/**
 * HeroSearchBar - Search component with autocomplete
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.9
 */
export function HeroSearchBar({
  placeholder = "Search for anything...",
  className,
  onSearch,
}: HeroSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Fetch autocomplete results
  const fetchResults = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Call semantic search API with autocomplete mode
      // Requirements: 12.2, 12.3, 22.3, 22.4
      const response = await fetch(
        `/api/search/semantic?q=${encodeURIComponent(searchQuery)}&mode=autocomplete&limit=8`
      );
      
      if (!response.ok) {
        throw new Error("Search failed");
      }
      
      const data = await response.json();
      const suggestions = data.suggestions || [];
      
      setResults(suggestions.slice(0, 8)); // Max 8 results - Requirement 12.4
      setIsOpen(true);
    } catch (error) {
      console.error("Search error:", error);
      // Fallback to empty results on error
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search - 300ms delay (Requirement 12.7)
  const debouncedFetchResults = useDebouncedCallback(fetchResults, 300);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    debouncedFetchResults(value);
  };

  // Handle keyboard navigation - Requirement 12.9
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle result selection
  const handleSelectResult = (result: AutocompleteResult) => {
    setQuery(result.title);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    if (onSearch) {
      onSearch(result.title);
    }
    
    // Navigate to result URL
    window.location.href = result.url;
  };

  // Handle search submit
  const handleSearch = () => {
    if (!query.trim()) return;
    
    setIsOpen(false);
    
    if (onSearch) {
      onSearch(query);
    }
    
    // Navigate to search page
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  // Clear search
  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input Container - Requirement 12.1 */}
      <motion.div
        initial={false}
        animate={{
          scale: isOpen ? 1.02 : 1,
          boxShadow: isOpen
            ? "0 0 0 2px rgba(0, 200, 83, 0.5)"
            : "0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
        transition={{ duration: 200 }}
        className="relative flex items-center bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border overflow-hidden"
      >
        {/* Search Icon */}
        <div className="pl-5 flex items-center pointer-events-none">
          <Search
            className="h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= 2 && results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Search marketplace"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-activedescendant={
            selectedIndex >= 0 ? `result-${selectedIndex}` : undefined
          }
          className="flex-1 bg-transparent px-4 py-4 text-white placeholder-gray-400 focus:outline-none min-h-[44px]"
        />

        {/* Loading or Clear Button */}
        <div className="pr-3 flex items-center">
          {isLoading ? (
            <Loader2
              className="h-5 w-5 text-naija-green animate-spin"
              aria-hidden="true"
            />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-naija-green"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </motion.div>

      {/* Autocomplete Dropdown - Requirement 12.4 */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            id="search-results"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={prefersReducedMotion ? {} : dropdownVariants}
            className="absolute top-full left-0 right-0 mt-2 bg-dark-card/95 backdrop-blur-xl border border-dark-border rounded-xl shadow-2xl overflow-hidden z-50"
            role="listbox"
            aria-label="Search suggestions"
          >
            <div className="max-h-80 overflow-y-auto">
              {results.map((result, index) => {
                const Icon = getResultIcon(result.type);
                const isSelected = index === selectedIndex;

                return (
                  <motion.button
                    key={`${result.type}-${result.id}`}
                    id={`result-${index}`}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={prefersReducedMotion ? {} : itemVariants}
                    onClick={() => handleSelectResult(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors min-h-[44px] focus:outline-none",
                      isSelected
                        ? "bg-naija-green/20 text-white"
                        : "hover:bg-gray-700/50 text-white"
                    )}
                  >
                    {/* Thumbnail or Icon */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        result.type === "listing"
                          ? "bg-naija-green/20"
                          : result.type === "category"
                          ? "bg-neon-cyan/20"
                          : "bg-neon-purple/20"
                      )}
                    >
                      {result.thumbnail ? (
                        <img
                          src={result.thumbnail}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            result.type === "listing"
                              ? "text-naija-green"
                              : result.type === "category"
                              ? "text-neon-cyan"
                              : "text-neon-purple"
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {/* Highlight matching text - Requirement 12.6 */}
                        {highlightMatch(result.title, query)}
                      </div>
                      {result.subtitle && (
                        <div className="text-sm text-gray-400 truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>

                    {/* Type Badge */}
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full flex-shrink-0",
                        result.type === "listing"
                          ? "bg-naija-green/20 text-naija-green"
                          : result.type === "category"
                          ? "bg-neon-cyan/20 text-neon-cyan"
                          : "bg-neon-purple/20 text-neon-purple"
                      )}
                    >
                      {result.type}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-dark-border bg-gray-800/50">
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <span>↑↓ to navigate</span>
                <span>•</span>
                <span>Enter to select</span>
                <span>•</span>
                <span>Esc to close</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results message */}
      <AnimatePresence>
        {isOpen && query.length >= 2 && !isLoading && results.length === 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={prefersReducedMotion ? {} : dropdownVariants}
            className="absolute top-full left-0 right-0 mt-2 bg-dark-card/95 backdrop-blur-xl border border-dark-border rounded-xl shadow-2xl p-6 text-center z-50"
          >
            <Search className="h-8 w-8 text-gray-600 mx-auto mb-2" aria-hidden="true" />
            <p className="text-gray-400">No results found for &quot;{query}&quot;</p>
            <p className="text-sm text-gray-500 mt-1">
              Try different keywords or browse categories
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
