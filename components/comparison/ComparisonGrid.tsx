/**
 * ComparisonGrid Component
 * Side-by-side product comparison with best value highlighting
 * Requirements: 3.3, 3.4, 3.5, 3.6
 * Tasks: 22.2, 22.5
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ComparisonCard } from "./ComparisonCard";
import type { Listing } from "@/lib/types";

interface ComparisonGridProps {
  listings: Listing[];
  onRemove: (id: string) => void;
}

export function ComparisonGrid({ listings, onRemove }: ComparisonGridProps) {
  // Calculate best values for highlighting (Requirement 3.5)
  const highlights = useMemo(() => {
    const result: Record<
      string,
      { price?: boolean; condition?: boolean; rating?: boolean }
    > = {};

    if (listings.length === 0) return result;

    // Find best price (lowest)
    const lowestPrice = Math.min(
      ...listings.filter((l) => l.price).map((l) => l.price!),
    );

    // Find best condition (new > refurbished > used)
    const conditionRank = { new: 3, refurbished: 2, used: 1 };
    const bestCondition = listings.reduce((best, listing) => {
      const currentRank =
        conditionRank[listing.condition as keyof typeof conditionRank] || 0;
      const bestRank = conditionRank[best as keyof typeof conditionRank] || 0;
      return currentRank > bestRank ? listing.condition : best;
    }, listings[0]?.condition);

    // Find best seller rating (highest trust score)
    const highestRating = Math.max(
      ...listings
        .filter((l) => l.user?.trust_score)
        .map((l) => l.user!.trust_score),
    );

    // Mark highlights for each listing
    listings.forEach((listing) => {
      result[listing.id] = {
        price: listing.price === lowestPrice,
        condition: listing.condition === bestCondition,
        rating: listing.user?.trust_score === highestRating,
      };
    });

    return result;
  }, [listings]);

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No products to compare</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Desktop: Grid Layout */}
      <div
        className="hidden md:grid gap-6"
        style={{
          gridTemplateColumns: `repeat(${Math.min(listings.length, 4)}, 1fr)`,
        }}
      >
        {listings.map((listing, index) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ComparisonCard
              listing={listing}
              onRemove={onRemove}
              highlights={highlights[listing.id] || {}}
            />
          </motion.div>
        ))}
      </div>

      {/* Mobile: Scrollable Cards */}
      <div className="md:hidden overflow-x-auto -mx-4 px-4">
        <div
          className="flex gap-4 pb-4"
          style={{ width: `${listings.length * 320}px` }}
        >
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-80 flex-shrink-0"
            >
              <ComparisonCard
                listing={listing}
                onRemove={onRemove}
                highlights={highlights[listing.id] || {}}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-naija-green rounded-full"></div>
          <span>Best Value</span>
        </div>
      </div>
    </div>
  );
}
