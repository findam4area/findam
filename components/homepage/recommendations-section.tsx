/**
 * RecommendationsSection Component
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 *
 * Displays personalized recommendations for authenticated users
 * or trending listings for anonymous users.
 */

"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { ListingCard } from "./listing-card";
import type { Listing as ComponentListing } from "./types";
import type { Listing as APIListing } from "@/lib/types";

interface RecommendationsSectionProps {
  userId?: string;
  className?: string;
}

interface RecommendationsResponse {
  listings: APIListing[];
  algorithm: "collaborative" | "content_based" | "trending" | "hybrid";
  confidence: number;
  personalized: boolean;
}

/**
 * Fetch recommendations from API
 */
async function fetchRecommendations(
  userId?: string,
): Promise<RecommendationsResponse> {
  const params = new URLSearchParams({
    limit: "8",
  });

  const response = await fetch(`/api/recommendations?${params}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch recommendations");
  }

  return response.json();
}

export function RecommendationsSection({
  userId,
  className = "",
}: RecommendationsSectionProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch recommendations
  const {
    data: recommendations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recommendations", userId],
    queryFn: () => fetchRecommendations(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Always fetch, API handles auth
  });

  /**
   * Handle refresh button click
   * Requirements: 10.6
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: ["recommendations", userId],
    });
    // Wait for animation
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Loading state (Requirement 10.8)
  if (isLoading) {
    return (
      <section className={`py-12 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recommended for You</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-lg bg-gray-200"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className={`py-12 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-800">
              Failed to load recommendations. Please try again later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // No recommendations
  if (!recommendations || recommendations.listings.length === 0) {
    return null;
  }

  const { listings, personalized, algorithm } = recommendations;

  // Display 4-8 listings (Requirement 10.1)
  const displayListings = listings.slice(0, 8);

  return (
    <section className={`py-12 ${className}`} data-testid="recommendations-section">
      <div className="container mx-auto px-4">
        {/* Header with refresh button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {personalized ? "Recommended for You" : "Trending Now"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {personalized
                ? "Based on your browsing history and preferences"
                : "Popular listings on FindAm"}
            </p>
          </div>

          {/* Refresh button (Requirement 10.6) */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            aria-label="Refresh recommendations"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Listings grid with aria-live for refresh announcements (Requirement 15.6) */}
        <div aria-live="polite" aria-atomic="false">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayListings.map((listing) => {
              // Transform API listing to component format
              const transformedListing = {
                id: listing.id,
                title: listing.title,
                price: listing.price || 0,
                currency: "NGN",
                location: listing.location || `${listing.lga}, ${listing.state}`,
                thumbnail: listing.thumbnail_url || "/placeholder-listing.jpg",
                images: listing.media?.map(m => m.media_url) || [],
                video: listing.media?.find(m => m.media_url.includes('video'))?.media_url,
                views: listing.views_count,
                likes: listing.likes_count,
                isBoosted: listing.is_boosted,
                vendor: {
                  id: listing.user?.id || "",
                  name: listing.user?.username || "Unknown",
                  avatar: listing.user?.avatar_url || "/placeholder-avatar.jpg",
                  isVerified: listing.user?.phone_verified && listing.user?.nin_verified && listing.user?.video_verified || false,
                },
                createdAt: listing.created_at,
              };
              
              return (
                <ListingCard
                  key={listing.id}
                  listing={transformedListing}
                  variant="default"
                  showVendor={true}
                />
              );
            })}
          </div>
        </div>

        {/* Algorithm indicator (for debugging/transparency) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 text-center text-xs text-gray-500">
            Algorithm: {algorithm} | Personalized: {personalized ? "Yes" : "No"}
          </div>
        )}
      </div>
    </section>
  );
}
