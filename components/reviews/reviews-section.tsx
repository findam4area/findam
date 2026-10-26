"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "./review-form";
import { ReviewList } from "./review-list";
import { AverageRating } from "./average-rating";
import { ReviewEditModal } from "./review-edit-modal";
import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ReviewsSectionProps {
  userId: string;
  currentUserId?: string;
  initialReviews?: Review[];
  initialAverage?: number;
  initialCount?: number;
  canReview?: boolean;
  className?: string;
}

export function ReviewsSection({
  userId,
  currentUserId,
  initialReviews = [],
  initialAverage = 0,
  initialCount = 0,
  canReview = false,
  className,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [average, setAverage] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch reviews
  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reviews?user_id=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");

      const data = await response.json();
      setReviews(data.data || []);
      setAverage(data.average || 0);
      setCount(data.count || 0);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit new review
  const handleSubmit = async (rating: number, comment: string) => {
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewed_user_id: userId,
          rating,
          comment: comment || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      setShowForm(false);
      await fetchReviews();
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  // Update review
  const handleUpdate = async (
    reviewId: string,
    rating: number,
    comment: string,
  ) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update review");
      }

      toast.success("Review updated successfully!");
      await fetchReviews();
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  // Delete review
  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete review");
      }

      toast.success("Review deleted successfully!");
      await fetchReviews();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Average Rating */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Reviews</h2>
          <AverageRating average={average} count={count} size="md" />
        </div>

        {/* Add Review Button */}
        {canReview && currentUserId && !showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="neon"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      <AnimatePresence>
        {showForm && currentUserId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card rounded-xl border border-dark-border p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Write Your Review
            </h3>
            <ReviewForm
              reviewedUserId={userId}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-naija-green border-t-transparent" />
        </div>
      ) : (
        <ReviewList
          reviews={reviews}
          currentUserId={currentUserId}
          onEdit={setEditingReview}
          onDelete={handleDelete}
        />
      )}

      {/* Edit Modal */}
      <ReviewEditModal
        review={editingReview}
        isOpen={!!editingReview}
        onClose={() => setEditingReview(null)}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
