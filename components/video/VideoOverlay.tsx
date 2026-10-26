/**
 * VideoOverlay Component
 * Requirements: 1.4, 1.9
 *
 * Displays product information overlay on video with:
 * - Product title, price, and seller info
 * - Tap handler to navigate to listing details
 * - Action buttons using Lucide Icons
 */

"use client";

import { useRouter } from "next/navigation";
import { VideoListing } from "@/lib/types/video";
import {
  Heart,
  MessageCircle,
  Share2,
  ShoppingCart,
  BadgeCheck,
} from "lucide-react";
import { useState } from "react";

interface VideoOverlayProps {
  video: VideoListing;
}

export function VideoOverlay({ video }: VideoOverlayProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);

  // Navigate to listing details (Requirement 1.9)
  const handleProductClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/listing/${video.product.id}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    // TODO: Implement like API call
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/listing/${video.product.id}#comments`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: video.product.title,
        text: `Check out ${video.product.title} for ${video.product.currency} ${video.product.price.toLocaleString()}`,
        url: `/listing/${video.product.id}`,
      });
    }
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/listing/${video.product.id}?action=buy`);
  };

  return (
    <>
      {/* Product information overlay (Requirement 1.4) */}
      <div
        className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent pointer-events-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 1.5rem)" }}
      >
        <div className="pointer-events-auto">
          {/* Seller info */}
          <div
            className="flex items-center gap-2 mb-3 cursor-pointer"
            onClick={handleProductClick}
          >
            <img
              src={video.seller.avatar || "/default-avatar.png"}
              alt={video.seller.username}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-white font-semibold text-sm truncate">
                  @{video.seller.username}
                </span>
                {video.seller.verified && (
                  <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* Product title and price */}
          <div className="cursor-pointer" onClick={handleProductClick}>
            <h3 className="text-white font-bold text-lg mb-1 line-clamp-2">
              {video.product.title}
            </h3>
            <p className="text-white text-xl font-bold">
              {video.product.currency} {video.product.price.toLocaleString()}
            </p>
          </div>

          {/* View count */}
          <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
            <span>{video.views.toLocaleString()} views</span>
            <span>{video.likes.toLocaleString()} likes</span>
          </div>
        </div>
      </div>

      {/* Action buttons (Requirement 1.9) */}
      <div className="absolute right-4 bottom-32 flex flex-col gap-4">
        {/* Like button */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 group"
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/70 transition-colors">
            <Heart
              className={`w-6 h-6 ${
                isLiked ? "fill-red-500 text-red-500" : "text-white"
              }`}
            />
          </div>
          <span className="text-white text-xs font-medium">
            {video.likes.toLocaleString()}
          </span>
        </button>

        {/* Comment button */}
        <button
          onClick={handleComment}
          className="flex flex-col items-center gap-1 group"
          aria-label="Comment"
        >
          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/70 transition-colors">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 group"
          aria-label="Share"
        >
          <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/70 transition-colors">
            <Share2 className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* Buy button */}
        <button
          onClick={handleBuy}
          className="flex flex-col items-center gap-1 group"
          aria-label="Buy now"
        >
          <div className="w-12 h-12 rounded-full bg-green-600 backdrop-blur-sm flex items-center justify-center group-hover:bg-green-700 transition-colors shadow-lg">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
        </button>
      </div>
    </>
  );
}
