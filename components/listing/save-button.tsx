"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { useHapticFeedback } from "@/lib/hooks/useHapticFeedback";
import { trackSave } from "@/lib/analytics";

interface SaveButtonProps {
  listingId: string;
  listingTitle?: string;
  initialSaved?: boolean;
  onSaveChange?: (saved: boolean) => void;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function SaveButton({
  listingId,
  listingTitle = '',
  initialSaved = false,
  onSaveChange,
  size = "md",
  showLabel = false,
}: SaveButtonProps) {
  const { user } = useAuth();
  const { triggerNotification } = useHapticFeedback();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Redirect to login or show login modal
      window.location.href = "/login";
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    const newSavedState = !isSaved;

    // Optimistic update
    setIsSaved(newSavedState);

    if (newSavedState) {
      setShowAnimation(true);
      triggerNotification("success");
      setTimeout(() => setShowAnimation(false), 600);
    }

    try {
      const response = await fetch(`/api/listings/${listingId}/save`, {
        method: newSavedState ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update save status");
      }

      // Track analytics event (Requirements: 18.3, 30.6)
      if (newSavedState) {
        trackSave(listingId, listingTitle);
      }

      onSaveChange?.(newSavedState);
    } catch (error) {
      console.error("Error updating save:", error);
      // Revert optimistic update
      setIsSaved(!newSavedState);
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
    <div className="flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleSave}
        disabled={isLoading}
        aria-label={isSaved ? "Unsave listing" : "Save listing"}
        aria-pressed={isSaved}
        className={`${sizeClasses[size]} rounded-full backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-naija-green focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors relative ${
          isSaved
            ? "bg-naija-green text-white"
            : "bg-black/50 text-white hover:bg-black/70"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <motion.svg
          className={iconSizes[size]}
          fill={isSaved ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          animate={
            showAnimation
              ? {
                  y: [0, -5, 0],
                  rotate: [0, -10, 10, 0],
                }
              : {}
          }
          transition={{ duration: 0.6 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </motion.svg>

        {/* Glow effect when saved */}
        {isSaved && (
          <motion.div
            className="absolute inset-0 rounded-full bg-naija-green"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.button>

      {showLabel && (
        <span className="text-sm font-medium">
          {isSaved ? "Saved" : "Save"}
        </span>
      )}
    </div>
  );
}
