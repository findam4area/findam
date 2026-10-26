/**
 * FeaturedListings Server Component
 * 
 * Displays featured listings on the homepage.
 * Fetches featured listings directly using server-side Supabase client.
 * 
 * Features:
 * - Server-side data fetching
 * - Responsive grid (1 col mobile, 2 cols tablet, 3+ cols desktop)
 * - Empty state handling
 * - Priority loading for first 3 images
 * 
 * Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

import Link from "next/link";
import { getFeaturedListings } from "@/lib/services/database";
import { ListingCard } from "./listing-card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

interface FeaturedListingsProps {
  limit?: number;
}

export async function FeaturedListings({ limit = 6 }: FeaturedListingsProps) {
  // Fetch featured listings using server-side Supabase client
  const listings = await getFeaturedListings(limit);

  // Handle error state
  if (listings === null) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto max-w-md">
          <p className="text-lg text-gray-400 mb-4">
            Failed to load featured listings. Please try again later.
          </p>
          <Link href="/browse">
            <Button variant="outline">Browse Listings Instead</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Handle empty state
  if (listings.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto max-w-md">
          <div className="mb-4">
            <Sparkles className="mx-auto h-16 w-16 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No featured listings yet
          </h3>
          <p className="text-gray-400 mb-6">
            Featured listings will appear here once they're selected by our team.
          </p>
          <Link href="/browse">
            <Button variant="neon">
              Browse All Listings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Render featured listings grid
  return (
    <div className="space-y-8">
      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing, index) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            index={index}
            priority={index < 3} // Prioritize first 3 images
          />
        ))}
      </div>

      {/* View all button */}
      <div className="text-center">
        <Link href="/browse">
          <Button variant="outline" size="lg" className="group">
            View All Listings
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * FeaturedListingsSkeleton - Loading placeholder
 * Use with React Suspense for streaming
 */
export function FeaturedListingsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800"
          >
            {/* Image skeleton */}
            <div className="relative aspect-[4/3] bg-gray-800 animate-pulse" />
            
            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-800 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-800 rounded animate-pulse w-1/2" />
              <div className="h-8 bg-gray-800 rounded animate-pulse w-1/3 mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
