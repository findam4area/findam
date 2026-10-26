"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Star, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ReviewListProps {
  reviews: Review[];
  currentUserId?: string;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  className?: string;
}

export function ReviewList({
  reviews,
  currentUserId,
  onEdit,
  onDelete,
  className,
}: ReviewListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering dates on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-800/50 mb-4">
          <Star className="h-8 w-8 text-gray-600" />
        </div>
        <p className="text-gray-400">No reviews yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Be the first to leave a review!
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
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

  return (
    <div className={cn("space-y-4", className)}>
      <AnimatePresence mode="popLayout">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="glass-card rounded-xl border border-dark-border p-4 hover:border-naija-green/30 transition-colors"
          >
            <div className="flex gap-4">
              {/* Reviewer Avatar */}
              <div className="flex-shrink-0">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-700">
                  {review.reviewer?.avatar_url ? (
                    <Image
                      src={review.reviewer.avatar_url}
                      alt={review.reviewer.username}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-naija-green to-neon-cyan text-lg font-bold text-white">
                      {review.reviewer?.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Review Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">
                      {review.reviewer?.username}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Star Rating */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-4 w-4",
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-600",
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {mounted
                          ? formatDate(review.created_at)
                          : new Date(review.created_at).toLocaleDateString()}
                      </span>
                      {review.updated_at !== review.created_at && (
                        <span className="text-xs text-gray-500">(edited)</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Menu (only for own reviews) */}
                  {currentUserId === review.reviewer_id &&
                    (onEdit || onDelete) && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === review.id ? null : review.id,
                            )
                          }
                          className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
                          aria-label="Review options"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </button>

                        <AnimatePresence>
                          {openMenuId === review.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 mt-2 w-40 glass-card rounded-lg border border-dark-border shadow-xl z-10 overflow-hidden"
                            >
                              {onEdit && (
                                <button
                                  onClick={() => {
                                    onEdit(review);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => {
                                    onDelete(review.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
