"use client";

/**
 * BusinessReviewsSection Component
 * Task 21.4: Add review functionality to business profile page
 * Requirements: 11.1, 11.3, 11.5, 12.6
 * 
 * Features:
 * - Integrate ReviewForm (only for authenticated users who aren't the owner)
 * - Integrate ReviewList below business details
 * - Integrate RatingBreakdown above review list
 * - Display success message on review submission
 * - Update displayed rating immediately after submission
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ReviewForm } from "./ReviewForm";
import { ReviewList } from "./ReviewList";
import { RatingBreakdown } from "./RatingBreakdown";
import type { BusinessReview } from "@/lib/types/review";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BusinessReviewsSectionProps {
  businessProfileId: string;
  currentUserId?: string;
  isOwner: boolean;
  initialReviews: BusinessReview[];
  initialAverageRating: number;
  initialReviewCount: number;
  initialRatingBreakdown: {
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
  };
}

export function BusinessReviewsSection({
  businessProfileId,
  currentUserId,
  isOwner,
  initialReviews,
  initialAverageRating,
  initialReviewCount,
  initialRatingBreakdown,
}: BusinessReviewsSectionProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<BusinessReview[]>(initialReviews);
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [ratingBreakdown, setRatingBreakdown] = useState(initialRatingBreakdown);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"recent" | "rating_high" | "rating_low">("recent");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const itemsPerPage = 10;

  const isAuthenticated = !!currentUserId;
  const canLeaveReview = isAuthenticated && !isOwner;

  // Requirement 11.1, 11.3: Submit review (authenticated users only, not owner)
  const handleSubmitReview = async (rating: number, comment: string) => {
    try {
      const response = await fetch(`/api/business-profiles/${businessProfileId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit review");
      }

      const data = await response.json();

      // Requirement 12.6: Update displayed rating immediately after submission
      setAverageRating(data.updated_business_rating.average_rating);
      setReviewCount(data.updated_business_rating.review_count);

      // Update rating breakdown
      const newBreakdown = { ...ratingBreakdown };
      if (rating === 5) newBreakdown.five_star++;
      else if (rating === 4) newBreakdown.four_star++;
      else if (rating === 3) newBreakdown.three_star++;
      else if (rating === 2) newBreakdown.two_star++;
      else if (rating === 1) newBreakdown.one_star++;
      setRatingBreakdown(newBreakdown);

      // Add new review to list
      setReviews([data.review, ...reviews]);

      // Show success message
      setSuccessMessage("Thank you! Your review has been submitted successfully.");
      setShowReviewForm(false);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);

      // Refresh the page data to ensure consistency
      router.refresh();
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // Fetch reviews with pagination and sorting
  const fetchReviews = useCallback(async (page: number, sort: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/business-profiles/${businessProfileId}/reviews?page=${page}&limit=${itemsPerPage}&sort_by=${sort}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      setReviews(data.reviews);
      setReviewCount(data.total);
      setRatingBreakdown(data.rating_breakdown);
    } catch (error: any) {
      setErrorMessage("Failed to load reviews. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [businessProfileId, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchReviews(page, sortBy);
  };

  const handleSortChange = (sort: "recent" | "rating_high" | "rating_low") => {
    setSortBy(sort);
    setCurrentPage(1);
    fetchReviews(1, sort);
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert className="bg-naija-green/10 border-naija-green/20 text-naija-green">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating Breakdown */}
      <RatingBreakdown
        averageRating={averageRating}
        reviewCount={reviewCount}
        ratingBreakdown={ratingBreakdown}
      />

      {/* Review Form - Only show for authenticated users who aren't the owner */}
      {canLeaveReview && (
        <Card className="glass-card border border-dark-border p-6">
          {!showReviewForm ? (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Share Your Experience
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Have you used this business? Let others know what you think!
              </p>
              <Button
                variant="neon"
                onClick={() => setShowReviewForm(true)}
              >
                Write a Review
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Write Your Review
              </h3>
              <ReviewForm
                businessProfileId={businessProfileId}
                onSubmit={handleSubmitReview}
                onSuccess={() => setShowReviewForm(false)}
              />
              <Button
                variant="ghost"
                onClick={() => setShowReviewForm(false)}
                className="mt-4"
              >
                Cancel
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Not authenticated message */}
      {!isAuthenticated && (
        <Card className="glass-card border border-dark-border p-6 text-center">
          <p className="text-gray-400">
            Please{" "}
            <a href="/login" className="text-naija-green hover:underline">
              sign in
            </a>{" "}
            to leave a review
          </p>
        </Card>
      )}

      {/* Owner message */}
      {isOwner && (
        <Card className="glass-card border border-dark-border p-6 text-center">
          <p className="text-gray-400">
            You cannot review your own business
          </p>
        </Card>
      )}

      {/* Review List */}
      <div>
        <h3 className="text-2xl font-semibold text-white mb-6">
          Customer Reviews
        </h3>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-naija-green border-r-transparent"></div>
            <p className="mt-4 text-gray-400">Loading reviews...</p>
          </div>
        ) : (
          <ReviewList
            reviews={reviews}
            totalReviews={reviewCount}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            sortBy={sortBy}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
          />
        )}
      </div>
    </div>
  );
}
