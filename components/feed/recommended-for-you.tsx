"use client";

import { useEffect, useState } from "react";
import { ListingCard } from "@/components/listing/listing-card";
import { Loader2, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Listing } from "@/lib/types";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecommendationResponse {
  listings: Listing[];
  algorithm: "collaborative" | "content_based" | "trending" | "hybrid";
  confidence: number;
  personalized: boolean;
}

interface RecommendedForYouProps {
  className?: string;
  limit?: number;
  excludeIds?: string[];
}

/**
 * RecommendedForYou Component
 * Requirements: 7.3, 7.6, 7.8
 *
 * Displays personalized recommendations with feedback collection
 */
export function RecommendedForYou({
  className,
  limit = 20,
  excludeIds = [],
}: RecommendedForYouProps) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] =
    useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<
    Record<string, "up" | "down">
  >({});

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          limit: limit.toString(),
        });

        if (excludeIds.length > 0) {
          params.append("exclude", excludeIds.join(","));
        }

        const response = await fetch(`/api/recommendations?${params}`);

        if (!response.ok) {
          throw new Error("Failed to load recommendations");
        }

        const data: RecommendationResponse = await response.json();
        setRecommendations(data);
      } catch (err) {
        console.error("Error loading recommendations:", err);
        setError("Failed to load recommendations");
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [user, limit, excludeIds]);

  const handleFeedback = async (listingId: string, feedback: "up" | "down") => {
    try {
      // Optimistic update
      setFeedbackGiven((prev) => ({ ...prev, [listingId]: feedback }));

      const response = await fetch("/api/recommendations/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId,
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      // Revert optimistic update
      setFeedbackGiven((prev) => {
        const updated = { ...prev };
        delete updated[listingId];
        return updated;
      });
    }
  };

  // Don't show section if user is not logged in
  if (!user) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <section
        className={cn("space-y-4", className)}
        aria-label="Loading recommendations"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-naija-green" aria-hidden="true" />
          <h2 className="text-xl font-bold text-white">Recommended for You</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-96 rounded-2xl bg-gray-800/50 animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
        <span className="sr-only">Loading recommendations...</span>
      </section>
    );
  }

  // Error state
  if (error || !recommendations) {
    return (
      <section
        className={cn("space-y-4", className)}
        aria-label="Recommendations error"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-naija-green" aria-hidden="true" />
          <h2 className="text-xl font-bold text-white">Recommended for You</h2>
        </div>
        <div className="text-center py-8 text-gray-400">
          <p>Unable to load recommendations. Please try again later.</p>
        </div>
      </section>
    );
  }

  // Empty state
  if (recommendations.listings.length === 0) {
    return (
      <section
        className={cn("space-y-4", className)}
        aria-label="No recommendations available"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-naija-green" aria-hidden="true" />
          <h2 className="text-xl font-bold text-white">Recommended for You</h2>
        </div>
        <div className="text-center py-8 text-gray-400">
          <p>
            Browse more listings to get personalized recommendations tailored
            just for you!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn("space-y-4", className)}
      aria-label="Personalized recommendations"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-naija-green" aria-hidden="true" />
          <h2 className="text-xl font-bold text-white">Recommended for You</h2>
        </div>
        {recommendations.personalized && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>
              {recommendations.algorithm === "hybrid"
                ? "Personalized"
                : recommendations.algorithm === "trending"
                  ? "Trending"
                  : "Curated"}
            </span>
            <span
              className="text-xs px-2 py-1 rounded-full bg-naija-green/20 text-naija-green"
              title={`Confidence: ${Math.round(recommendations.confidence * 100)}%`}
            >
              {Math.round(recommendations.confidence * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Recommendations Grid */}
      <ul
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        aria-label="Recommended listings"
      >
        <AnimatePresence mode="popLayout">
          {recommendations.listings.map((listing, index) => (
            <motion.li
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="list-none relative"
            >
              <ListingCard listing={listing} />

              {/* Feedback Buttons - Requirement 7.8 */}
              <div className="absolute top-2 right-2 flex gap-2 z-10">
                <Button
                  size="sm"
                  variant={
                    feedbackGiven[listing.id] === "up" ? "neon" : "ghost"
                  }
                  className={cn(
                    "h-8 w-8 p-0 rounded-full backdrop-blur-sm",
                    feedbackGiven[listing.id] === "up"
                      ? "bg-naija-green/90 hover:bg-naija-green"
                      : "bg-gray-900/70 hover:bg-gray-800/90",
                  )}
                  onClick={() => handleFeedback(listing.id, "up")}
                  aria-label="This recommendation is helpful"
                  title="Thumbs up"
                >
                  <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  variant={
                    feedbackGiven[listing.id] === "down"
                      ? "destructive"
                      : "ghost"
                  }
                  className={cn(
                    "h-8 w-8 p-0 rounded-full backdrop-blur-sm",
                    feedbackGiven[listing.id] === "down"
                      ? "bg-red-500/90 hover:bg-red-600"
                      : "bg-gray-900/70 hover:bg-gray-800/90",
                  )}
                  onClick={() => handleFeedback(listing.id, "down")}
                  aria-label="This recommendation is not helpful"
                  title="Thumbs down"
                >
                  <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
