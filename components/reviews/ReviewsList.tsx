"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ReviewCard } from "./ReviewCard";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  images: string[] | null;
  is_verified_purchase: boolean;
  helpfulness_votes: number;
  vendor_response: string | null;
  vendor_responded_at: string | null;
  created_at: string;
  reviewer: {
    id: string;
    username: string;
    avatar_url: string | null;
    trust_score: number;
  };
}

interface ReviewsListProps {
  reviews: Review[];
  average: number;
  count: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  onVote?: (reviewId: string) => void;
  onRespond?: (reviewId: string, response: string) => void;
  canRespond?: boolean;
  onSortChange?: (sort: "helpfulness" | "recency" | "rating") => void;
}

/**
 * ReviewsList component for displaying reviews with sorting and filtering
 * Requirements: 25.1, 25.4, 25.9
 */
export function ReviewsList({
  reviews,
  average,
  count,
  ratingDistribution,
  onVote,
  onRespond,
  canRespond = false,
  onSortChange,
}: ReviewsListProps) {
  const [sortBy, setSortBy] = useState<"helpfulness" | "recency" | "rating">(
    "recency",
  );

  const handleSortChange = (newSort: "helpfulness" | "recency" | "rating") => {
    setSortBy(newSort);
    if (onSortChange) {
      onSortChange(newSort);
    }
  };

  return (
    <div className="space-y-6">
      {/* Requirement 25.1: Average Rating Display */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-8">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900">{average.toFixed(1)}</div>
            <div className="mt-2 flex justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(average)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-600">{count} reviews</p>
          </div>

          {/* Requirement 25.4: 5-Star Breakdown */}
          <div className="flex-1">
            <h3 className="mb-3 font-semibold text-gray-900">
              Rating Distribution
            </h3>
            {[5, 4, 3, 2, 1].map((rating) => {
              const ratingCount = ratingDistribution[rating as keyof typeof ratingDistribution];
              const percentage = count > 0 ? (ratingCount / count) * 100 : 0;

              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="w-8 text-sm text-gray-600">{rating}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm text-gray-600">
                    {ratingCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Requirement 25.9: Sort Controls */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Customer Reviews
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) =>
              handleSortChange(
                e.target.value as "helpfulness" | "recency" | "rating",
              )
            }
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="recency">Most Recent</option>
            <option value="helpfulness">Most Helpful</option>
            <option value="rating">Highest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onVote={onVote}
              onRespond={onRespond}
              canRespond={canRespond}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">No reviews yet. Be the first to review!</p>
        </div>
      )}
    </div>
  );
}
