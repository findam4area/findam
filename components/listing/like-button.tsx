"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { useHapticFeedback } from "@/lib/hooks/useHapticFeedback";
import { trackEvent } from "@/lib/analytics";

interface LikeButtonProps {
  listingId: string;
  initialLiked?: boolean;
  initialCount?: number;
  onLikeChange?: (liked: boolean) => void;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function LikeButton({
  listingId,
  initialLiked = false,
  initialCount = 0,
  onLikeChange,
  size = "md",
  showCount = true,
}: LikeButtonProps) {
  const { user } = useAuth();
  const { triggerNotification } = useHapticFeedback();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    setIsLiked(initialLiked);
    setLikeCount(initialCount);
  }, [initialLiked, initialCount]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Redirect to login or show login modal
      window.location.href = "/login";
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    const newLikedState = !isLiked;

    // Optimistic update
    setIsLiked(newLikedState);
    setLikeCount((prev) => (newLikedState ? prev + 1 : prev - 1));

    if (newLikedState) {
      setShowSparkles(true);
      triggerNotification("success");
      setTimeout(() => setShowSparkles(false), 1000);
    }

    try {
      const response = await fetch(`/api/listings/${listingId}/like`, {
        method: newLikedState ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update like status");
      }

      // Track analytics event (Requirements: 18.3, 30.6)
      if (newLikedState) {
        trackEvent('listing_liked', {
          listing_id: listingId,
          timestamp: new Date().toISOString(),
        });
      }

      onLikeChange?.(newLikedState);
    } catch (error) {
      console.error("Error updating like:", error);
      // Revert optimistic update
      setIsLiked(!newLikedState);
      setLikeCount((prev) => (newLikedState ? prev - 1 : prev + 1));
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "p-2 min-w-[44px] min-h-[44px]",
    md: "p-2.5 min-w-[44px] min-h-[44px]",
    lg: "p-3 min-w-[48px] min-h-[48px]",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex items-center gap-1">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleLike}
        disabled={isLoading}
        aria-label={isLiked ? "Unlike listing" : "Like listing"}
        aria-pressed={isLiked}
        className={`${sizeClasses[size]} rounded-full backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-naija-green focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors relative ${
          isLiked
            ? "bg-red-500 text-white"
            : "bg-black/50 text-white hover:bg-black/70"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <motion.svg
          className={iconSizes[size]}
          fill={isLiked ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          animate={isLiked ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </motion.svg>

        {/* Sparkle animation */}
        {showSparkles && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-red-400 rounded-full"
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI) / 3) * 20,
                  y: Math.sin((i * Math.PI) / 3) * 20,
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </motion.button>

      {showCount && (
        <span className="text-sm font-medium" aria-label={`${likeCount} likes`}>
          {likeCount}
        </span>
      )}
    </div>
  );
}
