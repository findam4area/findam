"use client";

import { useState } from "react";
import { Star, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface DeliveryRatingProps {
  shipmentId: string;
  providerName: string;
  existingRating?: number;
  existingReview?: string;
  onRatingSubmitted?: () => void;
}

export function DeliveryRating({
  shipmentId,
  providerName,
  existingRating,
  existingReview,
  onRatingSubmitted,
}: DeliveryRatingProps) {
  const [rating, setRating] = useState(existingRating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState(existingReview || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/logistics/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentId,
          rating,
          review: review.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }

      setSuccess(true);
      setTimeout(() => {
        onRatingSubmitted?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const isReadOnly = !!existingRating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="h-5 w-5" />
          Rate Delivery Experience
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How was your delivery with {providerName}?
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              Thank you for rating your delivery experience!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Rating</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= (hoveredRating || rating);

              return (
                <button
                  key={star}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => !isReadOnly && setRating(star)}
                  onMouseEnter={() => !isReadOnly && setHoveredRating(star)}
                  onMouseLeave={() => !isReadOnly && setHoveredRating(0)}
                  className={cn(
                    "transition-all",
                    !isReadOnly && "hover:scale-110 cursor-pointer",
                    isReadOnly && "cursor-default",
                  )}
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      isFilled
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-none text-gray-300",
                    )}
                  />
                </button>
              );
            })}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {rating} / 5
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="review">Review (Optional)</Label>
          <Textarea
            id="review"
            placeholder="Share your delivery experience..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            disabled={isReadOnly}
            rows={4}
            maxLength={500}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {review.length} / 500 characters
          </p>
        </div>

        {!isReadOnly && (
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || success}
            className="w-full"
          >
            {submitting
              ? "Submitting..."
              : success
                ? "Submitted!"
                : "Submit Rating"}
          </Button>
        )}

        {isReadOnly && (
          <p className="text-sm text-muted-foreground text-center">
            You have already rated this delivery
          </p>
        )}
      </CardContent>
    </Card>
  );
}
