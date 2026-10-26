"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ListingCard } from "./listing-card";
import { StaleContentWarning } from "@/components/stale-content-warning";
import { 
  getCachedListings, 
  cacheListings, 
  getOldestCacheTimestamp,
  isOnline 
} from "@/lib/utils/offline-storage";
import type { FeaturedListingsProps, Listing } from "./types";
import { useEffect, useState } from "react";

/**
 * FeaturedListings Component
 * 
 * Display curated listings with lazy loading and skeleton states using TanStack Query.
 * Includes offline support and stale content warnings.
 * 
 * Requirements:
 * - 3.1: Fetch and display 6-12 featured listings
 * - 3.2: Hover effects on listing cards
 * - 3.3: Display listing details (thumbnail, title, price, location, views, likes)
 * - 3.4: Video play button overlay
 * - 3.5: Display boost badges
 * - 3.6: Navigate to listing detail page on click
 * - 3.7: Lazy loading for images with blur-up placeholders
 * - 3.8: Display skeleton loading states while fetching
 * - 17.2: Display cached listings when offline
 * - 17.8: Display stale content warnings for data older than 24 hours
 */

async function fetchFeaturedListings(): Promise<Listing[]> {
  const response = await fetch("/api/listings/featured");
  if (!response.ok) {
    throw new Error("Failed to fetch featured listings");
  }
  const data = await response.json();
  
  // Cache the listings for offline access (Requirement 17.2)
  if (isOnline()) {
    await cacheListings(data);
  }
  
  return data;
}

function ListingCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-card border animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[4/3] bg-muted" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-6 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="flex gap-4">
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-16" />
        </div>
        <div className="flex items-center gap-2 pt-3 border-t">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div className="h-4 bg-muted rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export function FeaturedListings({
  initialListings,
  className = "",
}: FeaturedListingsProps) {
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // TanStack Query integration (Requirement 3.1)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["listings", "featured"],
    queryFn: async () => {
      // If offline, try to return cached data (Requirement 17.2)
      if (!isOnline()) {
        const cached = await getCachedListings();
        if (cached && cached.length > 0) {
          return cached;
        }
      }
      return fetchFeaturedListings();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: initialListings,
  });

  const listings = data ?? initialListings ?? [];

  // Get cache timestamp for stale content warning (Requirement 17.8)
  useEffect(() => {
    const loadCacheTimestamp = async () => {
      const timestamp = await getOldestCacheTimestamp();
      setCacheTimestamp(timestamp);
    };
    loadCacheTimestamp();
  }, [data]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      // Update cache timestamp after successful refresh
      const timestamp = await getOldestCacheTimestamp();
      setCacheTimestamp(timestamp);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <section className={`py-12 ${className}`} aria-labelledby="featured-listings-heading" role="region">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          {/* Proper heading hierarchy - h2 follows h1 - Requirements: 15.7 */}
          <h2 id="featured-listings-heading" className="text-3xl font-bold mb-2">Featured Listings</h2>
          <p className="text-muted-foreground">
            Discover trending products and services
          </p>
        </div>

        {/* Stale Content Warning - Requirement 17.8 */}
        {cacheTimestamp && (
          <div className="mb-6">
            <StaleContentWarning
              lastUpdated={cacheTimestamp}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          </div>
        )}

        {/* Error State with aria-live for screen readers - Requirements: 15.6 */}
        {error && (
          <div className="text-center py-12" role="alert" aria-live="assertive" aria-atomic="true">
            <p className="text-destructive mb-4">
              Failed to load featured listings
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px] min-w-[44px]"
              aria-label="Retry loading featured listings"
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State - Skeleton (Requirement 3.8) */}
        {isLoading && !initialListings && (
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            role="list"
            aria-label="Loading featured listings"
            aria-busy="true"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} role="listitem">
                <ListingCardSkeleton />
              </div>
            ))}
          </div>
        )}

        {/* Listings Grid */}
        {!error && listings.length > 0 && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            role="list"
            aria-label="Featured listings"
          >
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.3 }}
                role="listitem"
              >
                <ListingCard
                  listing={listing}
                  variant={index < 2 ? "featured" : "default"}
                  showVendor={true}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!error && !isLoading && listings.length === 0 && (
          <div className="text-center py-12" role="status">
            <p className="text-muted-foreground mb-4">
              No featured listings available at the moment
            </p>
            <a
              href="/search"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]"
              aria-label="Browse all listings"
            >
              Browse All Listings
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
