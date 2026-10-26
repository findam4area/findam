"use client";

/**
 * RatingBreakdown Component for Business Profiles
 * Task 21.3: Create RatingBreakdown component
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 * 
 * Features:
 * - Display average rating with stars
 * - Display total review count
 * - Display bar chart showing 5-star, 4-star, 3-star, 2-star, 1-star counts
 * - Show "No reviews yet" message when review_count=0
 */

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface RatingBreakdownProps {
  averageRating: number;
  reviewCount: number;
  ratingBreakdown: {
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
  };
  className?: string;
}

export function RatingBreakdown({
  averageRating,
  reviewCount,
  ratingBreakdown,
  className,
}: RatingBreakdownProps) {
  // Requirement 12.4: Show "No reviews yet" when review_count=0
  if (reviewCount === 0) {
    return (
      <div className={cn("glass-card rounded-xl border border-dark-border p-6", className)}>
        <div className="text-center py-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-800/50 mb-4">
            <Star className="h-8 w-8 text-gray-600" />
          </div>
          <p className="text-lg font-medium text-gray-400">No reviews yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Be the first to review this business
          </p>
        </div>
      </div>
    );
  }

  const ratingBars = [
    { stars: 5, count: ratingBreakdown.five_star, label: "5 stars" },
    { stars: 4, count: ratingBreakdown.four_star, label: "4 stars" },
    { stars: 3, count: ratingBreakdown.three_star, label: "3 stars" },
    { stars: 2, count: ratingBreakdown.two_star, label: "2 stars" },
    { stars: 1, count: ratingBreakdown.one_star, label: "1 star" },
  ];

  const getPercentage = (count: number): number => {
    if (reviewCount === 0) return 0;
    return (count / reviewCount) * 100;
  };

  return (
    <div className={cn("glass-card rounded-xl border border-dark-border p-6", className)}>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Average Rating Display */}
        <div className="flex flex-col items-center justify-center space-y-3 border-r border-gray-800 pr-8">
          {/* Requirement 12.1: Display average rating as decimal from 1.0 to 5.0 */}
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">
              {averageRating.toFixed(1)}
            </div>
            
            {/* Requirement 12.2: Display average rating with visual star indicators */}
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= Math.round(averageRating);
                return (
                  <Star
                    key={star}
                    className={cn(
                      "h-6 w-6",
                      filled
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-600"
                    )}
                  />
                );
              })}
            </div>
            
            {/* Requirement 12.3: Display total review count */}
            <p className="text-sm text-gray-400">
              Based on {reviewCount.toLocaleString()} review
              {reviewCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Right: Rating Breakdown Bar Chart */}
        {/* Requirement 12.5: Display breakdown showing counts per star level */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white mb-4">
            Rating Distribution
          </h3>
          {ratingBars.map((bar, index) => {
            const percentage = getPercentage(bar.count);
            return (
              <motion.div
                key={bar.stars}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center gap-3"
              >
                {/* Star Label */}
                <div className="flex items-center gap-1 w-16 flex-shrink-0">
                  <span className="text-sm text-gray-400">{bar.stars}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>

                {/* Progress Bar */}
                <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={cn(
                      "h-full rounded-full transition-all",
                      bar.stars === 5 && "bg-naija-green",
                      bar.stars === 4 && "bg-green-500",
                      bar.stars === 3 && "bg-yellow-500",
                      bar.stars === 2 && "bg-orange-500",
                      bar.stars === 1 && "bg-red-500"
                    )}
                  />
                </div>

                {/* Count */}
                <div className="w-12 text-right flex-shrink-0">
                  <span className="text-sm text-gray-400">
                    {bar.count}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
