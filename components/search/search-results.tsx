"use client";

import { useState } from "react";
import { Grid, List, Loader2 } from "lucide-react";
import { ListingCard } from "@/components/listing/listing-card";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import type { Listing } from "@/lib/types";
import { motion } from "framer-motion";

interface SearchResultsProps {
  listings: Listing[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => Promise<void>;
}

type ViewMode = "grid" | "list";

export function SearchResults({
  listings,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onRefresh,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    }
  };

  if (isLoading && listings.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
      </div>
    );
  }

  if (!isLoading && listings.length === 0) {
    return <EmptyState />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={!onRefresh}>
      <div className="space-y-6">
        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {listings.length} {listings.length === 1 ? "result" : "results"}{" "}
            found
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-neon-cyan/20 text-neon-cyan"
                  : "text-gray-400 hover:text-white"
              }`}
              aria-label="Grid view"
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-neon-cyan/20 text-neon-cyan"
                  : "text-gray-400 hover:text-white"
              }`}
              aria-label="List view"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Results Grid/List */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "flex flex-col gap-4"
          }
        >
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <ListingCard listing={listing} viewMode={viewMode} />
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center pt-8">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoading}
              className="px-6 py-3 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}

function EmptyState() {
  const suggestions = [
    "Try different keywords",
    "Remove some filters",
    "Check your spelling",
    "Browse all categories",
  ];

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-24 h-24 mb-6 rounded-full bg-dark-card border-2 border-dashed border-dark-border flex items-center justify-center">
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">
        No results found
      </h3>
      <p className="text-gray-400 text-center mb-6 max-w-md">
        We couldn&apos;t find any listings matching your search. Try adjusting
        your filters or search terms.
      </p>

      <div className="space-y-2">
        <p className="text-sm text-gray-400 font-medium">Suggestions:</p>
        <ul className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              className="text-sm text-gray-300 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
