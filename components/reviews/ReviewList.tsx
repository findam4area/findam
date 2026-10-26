"use client";

/**
 * ReviewList Component for Business Profiles
 * Task 21.2: Create ReviewList component
 * Requirements: 11.5, 11.6
 * 
 * Features:
 * - Display reviews in reverse chronological order
 * - Show reviewer name, rating, comment, timestamp
 * - Show business owner response if present
 * - Pagination controls
 * - Sort by selector (recent, rating_high, rating_low)
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BusinessReview } from "@/lib/types/review";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ReviewListProps {
  reviews: BusinessReview[];
  totalReviews: number;
  currentPage: number;
  itemsPerPage: number;
  sortBy: "recent" | "rating_high" | "rating_low";
  onPageChange: (page: number) => void;
  onSortChange: (sort: "recent" | "rating_high" | "rating_low") => void;
  className?: string;
}

export function ReviewList({
  reviews,
  totalReviews,
  currentPage,
  itemsPerPage,
  sortBy,
  onPageChange,
  onSortChange,
  className,
}: ReviewListProps) {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering dates on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalPages = Math.ceil(totalReviews / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-800/50 mb-4">
          <Star className="h-8 w-8 text-gray-600" />
        </div>
        <p className="text-gray-400 font-medium">No reviews yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Be the first to leave a review!
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing {reviews.length} of {totalReviews} review
          {totalReviews !== 1 ? "s" : ""}
        </p>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="rating_high">Highest Rating</SelectItem>
            <SelectItem value="rating_low">Lowest Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="glass-card rounded-xl border border-dark-border p-6 hover:border-naija-green/30 transition-colors"
            >
              <div className="flex gap-4">
                {/* Reviewer Avatar */}
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-700">
                    {review.reviewer?.avatar_url ? (
                      <Image
                        src={review.reviewer.avatar_url}
                        alt={review.reviewer.username || "User"}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-naija-green to-neon-cyan text-lg font-bold text-white">
                        {(review.reviewer?.username || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Header */}
                  <div className="space-y-1">
                    <h4 className="font-semibold text-white">
                      {review.reviewer?.username || "Anonymous User"}
                    </h4>
                    <div className="flex items-center gap-3">
                      {/* Star Rating */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-4 w-4",
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-600"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {mounted
                          ? formatDate(review.created_at)
                          : new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {review.comment}
                    </p>
                  )}

                  {/* Business Owner Response */}
                  {review.owner_response && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 ml-4 pl-4 border-l-2 border-naija-green/30 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-naija-green/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-naija-green">
                            B
                          </span>
                        </div>
                        <p className="text-xs font-medium text-naija-green">
                          Business Owner Response
                        </p>
                        {review.responded_at && (
                          <span className="text-xs text-gray-500">
                            {mounted
                              ? formatDate(review.responded_at)
                              : new Date(review.responded_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {review.owner_response}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "neon" : "ghost"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
