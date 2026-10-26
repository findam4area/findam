"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "./review-form";
import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ReviewEditModalProps {
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    reviewId: string,
    rating: number,
    comment: string,
  ) => Promise<void>;
}

export function ReviewEditModal({
  review,
  isOpen,
  onClose,
  onUpdate,
}: ReviewEditModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (rating: number, comment: string) => {
    if (!review) return;

    setIsUpdating(true);
    try {
      await onUpdate(review.id, rating, comment);
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  if (!review) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="glass-card relative w-full max-w-lg rounded-2xl border border-dark-border p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Edit Review</h2>
                <button
                  onClick={onClose}
                  disabled={isUpdating}
                  className="rounded-lg p-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Form */}
              <ReviewForm
                reviewedUserId={review.reviewed_user_id}
                listingId={review.listing_id || undefined}
                onSubmit={handleSubmit}
                onCancel={onClose}
                initialRating={review.rating}
                initialComment={review.comment || ""}
                isEditing
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
