"use client";

/**
 * ListingReviewsSection Component
 * Task 19.2: Display reviews with sorting and filtering
 * Requirements: 25.1, 25.4, 25.6, 25.8, 25.9
 * 
 * Features:
 * - Display average ratings with 5-star breakdown (Requirement 25.1, 25.4)
 * - Show "Verified Purchase" badges on confirmed buyer reviews (Requirement 25.6)
 * - Sort reviews by helpfulness, recency, or rating (Requirement 25.9)
 * - Allow vendors to respond to reviews publicly (Requirement 25.8)
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { Star, ThumbsUp, CheckCircle2, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
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
  images?: string[];
}

interface ReviewData {
  data: Review[];
  average: number;
  count: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ListingReviewsSectionProps {
  listingId: string;
  vendorId: string;
  currentUserId?: string;
  isVendor?: boolean;
  className?: string;
}

export function ListingReviewsSection({
  listingId,
  vendorId,
  currentUserId,
  isVendor = false,
  className,
}: ListingReviewsSectionProps) {
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"recency" | "helpfulness" | "rating">("recency");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Fetch reviews
  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reviews?listing_id=${listingId}&sort=${sortBy}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");

      const data = await response.json();
      setReviewData(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [listingId, sortBy]);

  // Submit vendor response
  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast.error("Please enter a response");
      return;
    }

    setIsSubmittingResponse(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responseText }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit response");
      }

      toast.success("Response submitted successfully!");
      setRespondingTo(null);
      setResponseText("");
      await fetchReviews();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Vote helpful
  const handleVoteHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to vote");
      }

      await fetchReviews();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-naija-green border-t-transparent" />
      </div>
    );
  }

  if (!reviewData) {
    return null;
  }

  const { data: reviews, average, count, ratingDistribution } = reviewData;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Requirement 25.1, 25.4: Average Rating & 5-Star Breakdown */}
      <div className="glass-card rounded-xl border border-dark-border p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Customer Reviews</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Average Rating */}
          <div className="flex flex-col items-center justify-center space-y-3 md:border-r border-gray-800 md:pr-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">
                {average.toFixed(1)}
              </div>
              
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= Math.round(average);
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
              
              <p className="text-sm text-gray-400">
                Based on {count.toLocaleString()} review{count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Right: 5-Star Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white mb-4">
              Rating Distribution
            </h3>
            {[5, 4, 3, 2, 1].map((stars, index) => {
              const starCount = ratingDistribution[stars as keyof typeof ratingDistribution];
              const percentage = count > 0 ? (starCount / count) * 100 : 0;
              return (
                <motion.div
                  key={stars}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex items-center gap-1 w-16 flex-shrink-0">
                    <span className="text-sm text-gray-400">{stars}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>

                  <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className={cn(
                        "h-full rounded-full transition-all",
                        stars === 5 && "bg-naija-green",
                        stars === 4 && "bg-green-500",
                        stars === 3 && "bg-yellow-500",
                        stars === 2 && "bg-orange-500",
                        stars === 1 && "bg-red-500"
                      )}
                    />
                  </div>

                  <div className="w-12 text-right flex-shrink-0">
                    <span className="text-sm text-gray-400">{starCount}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Requirement 25.9: Sort Controls */}
      {count > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </p>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recency">Most Recent</SelectItem>
              <SelectItem value="helpfulness">Most Helpful</SelectItem>
              <SelectItem value="rating">Highest Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-800/50 mb-4">
            <Star className="h-8 w-8 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">No reviews yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Be the first to leave a review!
          </p>
        </div>
      ) : (
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-white">
                          {review.reviewer?.username || "Anonymous User"}
                        </h4>
                        
                        {/* Requirement 25.6: Verified Purchase Badge */}
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 bg-naija-green/20 text-naija-green px-2 py-0.5 rounded-full text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      
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
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {review.comment}
                      </p>
                    )}

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {review.images.map((imageUrl, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="w-20 h-20 rounded-lg overflow-hidden border border-gray-700"
                          >
                            <Image
                              src={imageUrl}
                              alt={`Review image ${imgIndex + 1}`}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Helpfulness Votes */}
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVoteHelpful(review.id)}
                        disabled={!currentUserId}
                        className="gap-2 text-xs"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        Helpful ({review.helpfulness_votes})
                      </Button>

                      {/* Requirement 25.8: Vendor Response Button */}
                      {isVendor && !review.vendor_response && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRespondingTo(review.id)}
                          className="gap-2 text-xs"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Respond
                        </Button>
                      )}
                    </div>

                    {/* Requirement 25.8: Vendor Response Form */}
                    {respondingTo === review.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 space-y-3"
                      >
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Write your response..."
                          className="w-full px-4 py-3 bg-dark-card border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-naija-green focus:outline-none focus:ring-1 focus:ring-naija-green resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSubmitResponse(review.id)}
                            disabled={isSubmittingResponse || !responseText.trim()}
                            size="sm"
                            variant="neon"
                          >
                            {isSubmittingResponse ? "Submitting..." : "Submit Response"}
                          </Button>
                          <Button
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseText("");
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* Requirement 25.8: Display Vendor Response */}
                    {review.vendor_response && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 ml-4 pl-4 border-l-2 border-naija-green/30 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-naija-green/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-naija-green">
                              V
                            </span>
                          </div>
                          <p className="text-xs font-medium text-naija-green">
                            Vendor Response
                          </p>
                          {review.vendor_responded_at && (
                            <span className="text-xs text-gray-500">
                              {formatDate(review.vendor_responded_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {review.vendor_response}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
