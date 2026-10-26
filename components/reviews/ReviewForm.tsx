"use client";

/**
 * ReviewForm Component for Business Profiles
 * Task 21.1: Create ReviewForm component
 * Requirements: 11.1, 11.2
 * 
 * Features:
 * - Star rating selector (1-5 stars)
 * - Comment textarea (10-1000 characters)
 * - Character count display
 * - Submit button
 * - Display validation errors
 */

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ReviewFormProps {
  businessProfileId: string;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onSuccess?: () => void;
  className?: string;
}

export function ReviewForm({
  businessProfileId,
  onSubmit,
  onSuccess,
  className,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    rating?: string;
    comment?: string;
    general?: string;
  }>({});

  const MIN_COMMENT_LENGTH = 10;
  const MAX_COMMENT_LENGTH = 1000;

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate rating (Requirement 11.1)
    if (rating === 0) {
      newErrors.rating = "Please select a rating";
    }

    // Validate comment length (Requirement 11.2)
    if (comment.trim().length > 0 && comment.trim().length < MIN_COMMENT_LENGTH) {
      newErrors.comment = `Comment must be at least ${MIN_COMMENT_LENGTH} characters`;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      newErrors.comment = `Comment must not exceed ${MAX_COMMENT_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(rating, comment.trim());
      
      // Reset form on success
      setRating(0);
      setComment("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrors({
        general: err.message || "Failed to submit review. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "";
    }
  };

  const commentCharsRemaining = MAX_COMMENT_LENGTH - comment.length;
  const isCommentTooShort =
    comment.trim().length > 0 && comment.trim().length < MIN_COMMENT_LENGTH;

  return (
    <motion.form
      onSubmit={handleSubmit}
      className={cn("space-y-6", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Rating Stars */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">
          Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-naija-green rounded"
              aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-600 hover:text-gray-500"
                )}
              />
            </button>
          ))}
          {(hoveredRating || rating) > 0 && (
            <span className="ml-2 text-sm text-gray-400">
              {getRatingLabel(hoveredRating || rating)}
            </span>
          )}
        </div>
        {errors.rating && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400"
          >
            {errors.rating}
          </motion.p>
        )}
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label htmlFor="review-comment" className="text-sm font-medium text-white">
          Comment <span className="text-gray-500">(Optional)</span>
        </label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this business..."
          rows={5}
          maxLength={MAX_COMMENT_LENGTH}
          className={cn(
            "resize-none",
            errors.comment && "border-red-500 focus:ring-red-500"
          )}
          aria-describedby="comment-help comment-error"
        />
        <div className="flex items-center justify-between text-xs">
          <p
            id="comment-help"
            className={cn(
              "transition-colors",
              isCommentTooShort
                ? "text-amber-400"
                : comment.trim().length >= MIN_COMMENT_LENGTH
                  ? "text-naija-green"
                  : "text-gray-400"
            )}
          >
            {comment.trim().length > 0 && comment.trim().length < MIN_COMMENT_LENGTH
              ? `${MIN_COMMENT_LENGTH - comment.trim().length} more characters needed`
              : comment.trim().length >= MIN_COMMENT_LENGTH
                ? "Comment length is good"
                : `Minimum ${MIN_COMMENT_LENGTH} characters recommended`}
          </p>
          <p
            className={cn(
              "transition-colors",
              commentCharsRemaining < 100 ? "text-amber-400" : "text-gray-400"
            )}
          >
            {comment.length}/{MAX_COMMENT_LENGTH}
          </p>
        </div>
        {errors.comment && (
          <motion.p
            id="comment-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400"
          >
            {errors.comment}
          </motion.p>
        )}
      </div>

      {/* General Error Message */}
      {errors.general && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400"
          role="alert"
        >
          {errors.general}
        </motion.div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="neon"
        disabled={isSubmitting || rating === 0}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </motion.form>
  );
}
