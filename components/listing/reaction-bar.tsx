"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Bookmark, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ReactionBarProps {
  listingId: string;
  initialLikes?: number;
  initialSaves?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  className?: string;
}

export function ReactionBar({
  listingId,
  initialLikes = 0,
  initialSaves = 0,
  isLiked: initialIsLiked = false,
  isSaved: initialIsSaved = false,
  className = "",
}: ReactionBarProps) {
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [savesCount, setSavesCount] = useState(initialSaves);

  // Like mutation with optimistic updates
  const likeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/listings/${id}/like`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to like listing");
      return response.json();
    },
    onMutate: async () => {
      // Optimistic update
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
    },
    onError: () => {
      // Revert on error
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1));
      toast.error("Failed to update like");
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
    },
  });

  // Save mutation with optimistic updates
  const saveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/listings/${id}/save`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to save listing");
      return response.json();
    },
    onMutate: async () => {
      // Optimistic update
      const newIsSaved = !isSaved;
      setIsSaved(newIsSaved);
      setSavesCount((prev) => (newIsSaved ? prev + 1 : prev - 1));
    },
    onError: () => {
      // Revert on error
      setIsSaved(!isSaved);
      setSavesCount((prev) => (isSaved ? prev + 1 : prev - 1));
      toast.error("Failed to update save");
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
      queryClient.invalidateQueries({ queryKey: ["saved-listings"] });
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate(listingId);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    saveMutation.mutate(listingId);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/listing/${listingId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this listing on FindAm",
          url,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy link");
      }
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Like Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleLike}
        disabled={likeMutation.isPending}
        aria-label={isLiked ? "Unlike listing" : "Like listing"}
        aria-pressed={isLiked}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-naija-green focus:ring-offset-2 focus:ring-offset-dark-bg ${
          isLiked
            ? "bg-red-500/20 text-red-500"
            : "bg-dark-card text-gray-400 hover:bg-dark-card/80 hover:text-red-500"
        }`}
      >
        <Heart
          className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
          aria-hidden="true"
        />
        <span className="text-sm font-medium">{likesCount}</span>
      </motion.button>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleSave}
        disabled={saveMutation.isPending}
        aria-label={isSaved ? "Unsave listing" : "Save listing"}
        aria-pressed={isSaved}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-naija-green focus:ring-offset-2 focus:ring-offset-dark-bg ${
          isSaved
            ? "bg-naija-green/20 text-naija-green"
            : "bg-dark-card text-gray-400 hover:bg-dark-card/80 hover:text-naija-green"
        }`}
      >
        <Bookmark
          className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`}
          aria-hidden="true"
        />
        <span className="text-sm font-medium">{savesCount}</span>
      </motion.button>

      {/* Share Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleShare}
        aria-label="Share listing"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-card text-gray-400 hover:bg-dark-card/80 hover:text-neon-cyan transition-colors focus:outline-none focus:ring-2 focus:ring-naija-green focus:ring-offset-2 focus:ring-offset-dark-bg"
      >
        <Share2 className="w-4 h-4" aria-hidden="true" />
        <span className="text-sm font-medium">Share</span>
      </motion.button>
    </div>
  );
}
