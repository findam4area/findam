"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ThumbsUp, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface ReviewCardProps {
  review: Review;
  onVote?: (reviewId: string) => void;
  onRespond?: (reviewId: string, response: string) => void;
  canRespond?: boolean;
}

/**
 * ReviewCard component for displaying individual reviews
 * Requirements: 25.1, 25.4, 25.6, 25.8
 */
export function ReviewCard({
  review,
  onVote,
  onRespond,
  canRespond = false,
}: ReviewCardProps) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async () => {
    if (onVote) {
      await onVote(review.id);
    }
  };

  const handleSubmitResponse = async () => {
    if (!response.trim() || !onRespond) return;

    setIsSubmitting(true);
    try {
      await onRespond(review.id, response);
      setShowResponseForm(false);
      setResponse("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-b border-gray-200 py-6 last:border-b-0">
      {/* Reviewer Info */}
      <div className="flex items-start gap-4">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
          {review.reviewer.avatar_url ? (
            <Image
              src={review.reviewer.avatar_url}
              alt={review.reviewer.username}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary-100 text-primary-600">
              {review.reviewer.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">
              {review.reviewer.username}
            </h4>
            {/* Requirement 25.8: Verified Purchase Badge */}
            {review.is_verified_purchase && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                <CheckCircle className="h-3 w-3" />
                Verified Purchase
              </span>
            )}
          </div>

          {/* Rating Stars */}
          <div className="mt-1 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {formatDistanceToNow(new Date(review.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Review Comment */}
          {review.comment && (
            <p className="mt-3 text-gray-700">{review.comment}</p>
          )}

          {/* Review Images */}
          {review.images && review.images.length > 0 && (
            <div className="mt-3 flex gap-2">
              {review.images.map((image, index) => (
                <div
                  key={index}
                  className="relative h-20 w-20 overflow-hidden rounded-lg"
                >
                  <Image
                    src={image}
                    alt={`Review image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Helpfulness Vote */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleVote}
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600"
            >
              <ThumbsUp className="h-4 w-4" />
              Helpful ({review.helpfulness_votes})
            </button>

            {/* Requirement 25.6: Vendor Response Button */}
            {canRespond && !review.vendor_response && (
              <button
                onClick={() => setShowResponseForm(true)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Respond
              </button>
            )}
          </div>

          {/* Vendor Response Form */}
          {showResponseForm && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write your response..."
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                rows={3}
                maxLength={500}
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setShowResponseForm(false)}
                  className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitResponse}
                  disabled={isSubmitting || !response.trim()}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Response"}
                </button>
              </div>
            </div>
          )}

          {/* Requirement 25.8: Display Vendor Response */}
          {review.vendor_response && (
            <div className="mt-4 rounded-lg bg-blue-50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-900">
                  Vendor Response
                </span>
                {review.vendor_responded_at && (
                  <span className="text-xs text-blue-600">
                    {formatDistanceToNow(new Date(review.vendor_responded_at), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-blue-900">
                {review.vendor_response}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
