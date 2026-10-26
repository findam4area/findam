import { Star } from "lucide-react";
import type { Review } from "@/lib/types";

interface StorefrontReviewsProps {
  reviews: Review[];
  averageRating: number;
}

export function StorefrontReviews({
  reviews,
  averageRating,
}: StorefrontReviewsProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      {/* Rating Summary */}
      <div className="mb-6 flex items-center gap-4 border-b pb-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-600">{reviews.length} reviews</div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-4 last:border-b-0">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
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
              </div>
              <span className="text-sm text-gray-600">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            {review.comment && (
              <p className="text-gray-700">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
