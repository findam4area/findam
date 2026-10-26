"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAutocomplete } from "@/lib/hooks/useSearch";
import {
  getRecentSearches,
  removeSearchFromHistory,
} from "@/lib/utils/search-history";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "Search for items, services, or categories...",
  defaultValue = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { suggestions, isLoading, fetchSuggestions } = useAutocomplete();
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
        fetchSuggestions(query);
      }, 300);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(query);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setQuery(text);
    handleSearch(text);
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
    inputRef.current?.focus();
  };

  const showRecentSearches =
    showSuggestions && query.trim().length < 2 && recentSearches.length > 0;
  const showAutocompleteSuggestions =
    showSuggestions && query.trim().length >= 2 && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
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
          className="pl-10 pr-10 h-12 bg-dark-card border-dark-border focus:border-neon-cyan transition-colors"
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-dark-card border border-dark-border rounded-lg shadow-xl overflow-hidden"
          >
            {showRecentSearches && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs text-gray-400 font-medium">
                  Recent Searches
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
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
                      aria-label="Remove from history"
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
                    Loading...
                  </div>
                )}
                {!isLoading &&
                  suggestions.map((suggestion, index) => (
                    <button
                      type="button"
                      key={`${suggestion.type}-${suggestion.id}-${index}`}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-dark-bg rounded-md transition-colors"
                    >
                      <Search className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-white">
                        {suggestion.text}
                      </span>
                      <span className="ml-auto text-xs text-gray-400 capitalize">
                        {suggestion.type}
                      </span>
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
