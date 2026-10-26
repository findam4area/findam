"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useFeed } from "@/lib/hooks/useFeed";
import { useIntersectionObserver } from "@/lib/hooks/useIntersectionObserver";
import { ListingCard } from "@/components/listing/listing-card";
import { Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FeedContainer() {
  const {
    listings,
    isLoading,
    isRefreshing,
    hasMore,
    isFetchingNextPage,
    loadMore,
    refresh,
  } = useFeed();

  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const refreshButtonRef = useRef<HTMLButtonElement>(null);

  // Intersection observer for infinite scroll
  const [loadMoreRef, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
  });

  // Load more when intersection observer triggers
  useEffect(() => {
    if (isIntersecting && hasMore && !isFetchingNextPage) {
      loadMore();
    }
  }, [isIntersecting, hasMore, isFetchingNextPage, loadMore]);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling || containerRef.current?.scrollTop !== 0) return;

      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStartY.current;

      if (distance > 0) {
        setPullDistance(Math.min(distance, 120));
      }
    },
    [isPulling],
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 80) {
      await refresh();
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, refresh]);

  // Keyboard-accessible refresh handler
  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // Compute aria-busy value
  const isBusy = isLoading || isRefreshing;

  // Skeleton loading state
  if (isLoading && listings.length === 0) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading listings">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-96 rounded-2xl bg-gray-800/50 animate-pulse"
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">Loading listings...</span>
      </div>
    );
  }

  return (
    <>
      {/* Keyboard-accessible refresh button */}
      <div className="flex justify-end mb-4">
        <button
          ref={refreshButtonRef}
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-label="Refresh listings feed"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      <section
        ref={containerRef}
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...(isBusy && { "aria-busy": true })}
        aria-label="Listings feed"
      >
        {/* Pull-to-refresh indicator */}
        <AnimatePresence>
          {isPulling && pullDistance > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 flex justify-center items-center h-20 z-10"
              style={{ transform: `translateY(${pullDistance - 80}px)` }}
              aria-live="polite"
              aria-label={
                pullDistance > 80 ? "Release to refresh" : "Pull to refresh"
              }
            >
              <div className="relative">
                <div
                  className="absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full"
                  aria-hidden="true"
                />
                <Loader2
                  className={`h-8 w-8 text-neon-cyan relative ${
                    pullDistance > 80 ? "animate-spin" : ""
                  }`}
                  style={{
                    transform: `rotate(${pullDistance * 3}deg)`,
                  }}
                  aria-hidden="true"
                />
              </div>
              <span className="sr-only">
                {pullDistance > 80
                  ? "Release to refresh feed"
                  : "Pull down to refresh feed"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Refreshing indicator */}
        {isRefreshing && (
          <div
            className="flex justify-center py-4"
            role="status"
            aria-live="polite"
          >
            <div className="relative">
              <div
                className="absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full animate-pulse"
                aria-hidden="true"
              />
              <Loader2
                className="h-6 w-6 animate-spin text-neon-cyan relative"
                aria-hidden="true"
              />
            </div>
            <span className="sr-only">Refreshing feed...</span>
          </div>
        )}

        {/* Listings grid */}
        <ul
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          aria-label="Available listings"
        >
          <AnimatePresence mode="popLayout">
            {listings.map((listing, index) => (
              <motion.li
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="list-none"
              >
                <ListingCard listing={listing} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {/* Empty state */}
        {!isLoading && listings.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            role="region"
            aria-label="Empty feed state"
          >
            <div className="text-6xl mb-4" role="img" aria-label="Empty box">
              📦
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No listings found
            </h2>
            <p className="text-gray-400">
              Try adjusting your filters or check back later
            </p>
          </div>
        )}

        {/* Load more trigger */}
        {hasMore && !isLoading && (
          <div
            ref={loadMoreRef}
            className="flex justify-center py-8"
            role="status"
            aria-live="polite"
            aria-label="Loading more listings"
          >
            <Loader2
              className="h-6 w-6 animate-spin text-naija-green"
              aria-hidden="true"
            />
            <span className="sr-only">Loading more listings...</span>
          </div>
        )}

        {/* End of feed */}
        {!hasMore && listings.length > 0 && (
          <div
            className="text-center py-8 text-gray-500"
            role="status"
            aria-live="polite"
            aria-label="End of feed reached"
          >
            You&apos;ve reached the end
          </div>
        )}
      </section>
    </>
  );
}
