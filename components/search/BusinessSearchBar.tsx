"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, Building2, FolderTree, MapPin, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  getRecentSearches,
  removeSearchFromHistory,
  addSearchToHistory,
} from "@/lib/utils/search-history";

interface AutocompleteSuggestion {
  type: "business" | "category" | "location" | "listing";
  id: string | null;
  text: string;
  location?: string; // For business suggestions
  rating?: number; // For business suggestions
}

interface BusinessSearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
  className?: string;
}

/**
 * BusinessSearchBar component with autocomplete functionality
 * 
 * Features:
 * - Real-time autocomplete suggestions as users type
 * - Displays suggestions categorized by type (business, category, location, listing)
 * - Type-specific icons for visual distinction
 * - Recent search history
 * - Navigate to search results on submit
 * 
 * Requirements: 4.4, 4.5
 */
export function BusinessSearchBar({
  placeholder = "Search businesses, categories, or locations...",
  defaultValue = "",
  onSearch,
  autoFocus = false,
  className = "",
}: BusinessSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Load recent searches on mount
  useEffect(() => {
    const recent = getRecentSearches();
    setRecentSearches(recent.map((item) => item.query));
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced autocomplete fetch
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        fetchAutocompleteSuggestions(query);
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const fetchAutocompleteSuggestions = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/search/autocomplete?q=${encodeURIComponent(searchQuery)}`,
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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
  };

  const handleSearch = (searchQuery: string, suggestionType?: string) => {
    if (!searchQuery.trim()) return;

    const trimmedQuery = searchQuery.trim();
    
    // Add to search history
    addSearchToHistory(trimmedQuery);
    
    // Close suggestions
    setShowSuggestions(false);
    inputRef.current?.blur();

    // Call parent onSearch callback if provided
    if (onSearch) {
      onSearch(trimmedQuery);
    }

    // Navigate to search results page
    const params = new URLSearchParams();
    params.set("q", trimmedQuery);
    
    // Add type hint if suggestion was clicked
    if (suggestionType) {
      params.set("type", suggestionType);
    }
    
    router.push(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(query);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text, suggestion.type);
  };

  const handleRemoveRecent = (
    searchQuery: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    removeSearchFromHistory(searchQuery);
    setRecentSearches((prev) => prev.filter((q) => q !== searchQuery));
  };

  const clearInput = () => {
    setQuery("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "business":
        return <Building2 className="h-4 w-4 text-blue-400" />;
      case "category":
        return <FolderTree className="h-4 w-4 text-purple-400" />;
      case "location":
        return <MapPin className="h-4 w-4 text-green-400" />;
      case "listing":
        return <Package className="h-4 w-4 text-orange-400" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  const showRecentSearches =
    showSuggestions && query.trim().length < 2 && recentSearches.length > 0;
  const showAutocompleteSuggestions =
    showSuggestions && query.trim().length >= 2 && suggestions.length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-10 pr-10 h-12 bg-dark-card border-dark-border focus:border-neon-cyan transition-colors"
          aria-label="Search businesses"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showSuggestions}
        />
        {query && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {(showRecentSearches || showAutocompleteSuggestions) && (
          <motion.div
            id="search-suggestions"
            role="listbox"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-dark-card border border-dark-border rounded-lg shadow-xl overflow-hidden max-h-96 overflow-y-auto"
          >
            {showRecentSearches && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs text-gray-400 font-medium">
                  Recent Searches
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    type="button"
                    key={`recent-${index}`}
                    onClick={() => handleSearch(search)}
                    role="option"
                    aria-selected={false}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-dark-bg rounded-md transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-white">{search}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRecent(search, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${search} from history`}
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-white" />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {showAutocompleteSuggestions && (
              <div className="p-2">
                {isLoading && (
                  <div className="px-3 py-2 text-sm text-gray-400">
                    Loading suggestions...
                  </div>
                )}
                {!isLoading &&
                  suggestions.map((suggestion, index) => (
                    <button
                      type="button"
                      key={`${suggestion.type}-${suggestion.id}-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      role="option"
                      aria-selected={false}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-dark-bg rounded-md transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm text-white">
                          {suggestion.text}
                        </div>
                        {suggestion.location && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {suggestion.location}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {suggestion.rating !== undefined && (
                          <span className="text-xs text-yellow-400">
                            ★ {suggestion.rating.toFixed(1)}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 capitalize px-2 py-0.5 bg-dark-bg rounded-full">
                          {suggestion.type}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
