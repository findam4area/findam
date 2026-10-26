"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AverageRatingProps {
  average: number;
  count: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AverageRating({
  average,
  count,
  showCount = true,
  size = "md",
  className,
}: AverageRatingProps) {
  const sizeClasses = {
    sm: {
      star: "h-4 w-4",
      text: "text-sm",
      rating: "text-lg",
    },
    md: {
      star: "h-5 w-5",
      text: "text-base",
      rating: "text-2xl",
    },
    lg: {
      star: "h-6 w-6",
      text: "text-lg",
      rating: "text-3xl",
    },
  };

  const classes = sizeClasses[size];

  // Calculate filled stars
  const fullStars = Math.floor(average);
  const hasHalfStar = average % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  if (count === 0) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={cn(classes.star, "text-gray-600")} />
          ))}
        </div>
        <span className={cn(classes.text, "text-gray-400")}>
          No reviews yet
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className={cn("flex items-center gap-3", className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Numeric Rating */}
      <div className="flex flex-col items-center">
        <span className={cn(classes.rating, "font-bold text-white")}>
          {average.toFixed(1)}
        </span>
        {showCount && (
          <span className="text-xs text-gray-400">
            {count} {count === 1 ? "review" : "reviews"}
          </span>
        )}
      </div>

      {/* Star Rating */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-0.5">
          {/* Full stars */}
          {Array.from({ length: fullStars }).map((_, i) => (
            <Star
              key={`full-${i}`}
              className={cn(classes.star, "fill-yellow-400 text-yellow-400")}
            />
          ))}

          {/* Half star */}
          {hasHalfStar && (
            <div className="relative">
              <Star className={cn(classes.star, "text-gray-600")} />
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star
                  className={cn(
                    classes.star,
                    "fill-yellow-400 text-yellow-400",
                  )}
                />
              </div>
            </div>
          )}

          {/* Empty stars */}
          {Array.from({ length: emptyStars }).map((_, i) => (
            <Star
              key={`empty-${i}`}
              className={cn(classes.star, "text-gray-600")}
            />
          ))}
        </div>

        {/* Rating Distribution (optional, for larger sizes) */}
        {size === "lg" && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>Based on {count} reviews</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
