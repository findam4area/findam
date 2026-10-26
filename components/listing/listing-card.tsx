"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { CldImage } from "next-cloudinary";
import { useIntersectionObserver } from "@/lib/hooks/useIntersectionObserver";
import { LocationDisplay } from "@/components/location";
import { PriceDisplay } from "@/components/shared";
import { VerificationBadge } from "@/components/verification";
import { PremiumBadge } from "@/components/subscription";
import { VendorBadge } from "@/components/shared/vendor-badge";
import { useComparisonStore } from "@/store/comparison";
import { useSellerBadge } from "@/lib/hooks/useSellerBadge";
import type { Listing } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

interface ListingCardProps {
  listing: Listing;
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
  onShare?: (id: string) => void;
  viewMode?: "grid" | "list";
}

export function ListingCard({
  listing,
  onLike,
  onSave,
  onShare,
  viewMode = "grid",
}: ListingCardProps) {
  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.5,
    freezeOnceVisible: false,
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch seller badge (Requirements: 15.1, 15.8)
  const { badge } = useSellerBadge(listing.user?.id);

  // Comparison store
  const { addListing, isInComparison, removeListing } = useComparisonStore();
  const inComparison = isInComparison(listing.id);

  // Auto-play video when in viewport
  useEffect(() => {
    if (videoRef.current) {
      if (isVisible) {
        videoRef.current.play().catch(() => {
          // Autoplay failed, user interaction required
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isVisible]);

  const firstMedia = listing.media?.[0];
  const isVideo = firstMedia?.media_type === "video";
  const mediaUrl = firstMedia?.media_url || listing.thumbnail_url;

  // Extract Cloudinary public ID from URL if it's a Cloudinary URL
  const getCloudinaryPublicId = (url?: string) => {
    if (!url) return null;
    // Check if it's a Cloudinary URL
    if (url.includes("cloudinary.com")) {
      const parts = url.split("/upload/");
      if (parts.length > 1) {
        // Remove version and get the public ID
        const pathParts = parts[1].split("/");
        return pathParts.slice(1).join("/").split(".")[0];
      }
    }
    return null;
  };

  const cloudinaryPublicId = getCloudinaryPublicId(mediaUrl);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLike?.(listing.id);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
    onSave?.(listing.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShare?.(listing.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inComparison) {
      removeListing(listing.id);
      toast.success("Removed from comparison");
    } else {
      const result = addListing(listing);
      if (result.success) {
        toast.success("Added to comparison");
      } else {
        toast.error(result.error || "Failed to add to comparison");
      }
    }
  };

  return (
    <Link
      href={`/listing/${listing.id}`}
      aria-label={`View details for ${listing.title}`}
    >
      <motion.div
        ref={ref}
        whileHover={{
          scale: 1.02,
          rotateY: viewMode === "grid" ? 2 : 0,
          rotateX: viewMode === "grid" ? -2 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
        }}
        className={`glass-card rounded-xl overflow-hidden cursor-pointer relative group focus-within:ring-2 focus-within:ring-naija-green focus-within:ring-offset-2 focus-within:ring-offset-dark-bg ${
          viewMode === "list" ? "flex flex-row" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          perspective: "1000px",
        }}
        role="article"
        aria-labelledby={`listing-title-${listing.id}`}
      >
        {/* Boosted Indicator with glowing effect */}
        {listing.is_boosted && (
          <div className="absolute top-3 left-3 z-10">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-naija-green to-neon-cyan blur-md opacity-75 animate-pulse" />
              {/* Badge */}
              <div className="relative bg-gradient-to-r from-naija-green to-neon-cyan px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Boosted
              </div>
            </div>
          </div>
        )}

        {/* Comparison Badge - Requirements: 3.2 */}
        {inComparison && (
          <div
            className="absolute top-3 left-3 z-10"
            style={{ marginTop: listing.is_boosted ? "40px" : "0" }}
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-neon-cyan blur-md opacity-75 animate-pulse" />
              {/* Badge */}
              <div className="relative bg-neon-cyan px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 text-dark-bg">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                In Comparison
              </div>
            </div>
          </div>
        )}

        {/* Media */}
        <div
          className={`relative bg-dark-bg overflow-hidden ${
            viewMode === "list" ? "w-48 h-48 flex-shrink-0" : "aspect-[4/3]"
          }`}
        >
          {isVideo && mediaUrl ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              poster={listing.thumbnail_url}
              aria-label={`Video preview for ${listing.title}`}
            />
          ) : cloudinaryPublicId ? (
            // Use CldImage for Cloudinary-hosted images with optimization
            <CldImage
              src={cloudinaryPublicId}
              alt={listing.title}
              width={400}
              height={300}
              crop="fill"
              gravity="auto"
              quality="auto"
              format="auto"
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : mediaUrl ? (
            // Fallback to Next.js Image for non-Cloudinary images
            <Image
              src={mediaUrl}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-dark-card">
              <svg
                className="w-16 h-16 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Media Count Indicator */}
          {listing.media && listing.media.length > 1 && (
            <div
              className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded-full text-xs flex items-center gap-1"
              aria-label={`${listing.media.length} media items`}
            >
              <svg
                className="w-3 h-3"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              <span aria-hidden="true">{listing.media.length}</span>
            </div>
          )}

          {/* Action Buttons Overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              aria-label={isLiked ? "Unlike listing" : "Like listing"}
              aria-pressed={isLiked}
              className={`p-2 rounded-full backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-naija-green focus:ring-offset-2 focus:ring-offset-dark-bg ${
                isLiked
                  ? "bg-red-500 text-white"
                  : "bg-black/50 text-white hover:bg-black/70"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSave}
              aria-label={isSaved ? "Unsave listing" : "Save listing"}
              aria-pressed={isSaved}
              className={`p-2 rounded-full backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-naija-green focus:ring-offset-2 focus:ring-offset-dark-bg ${
                isSaved
                  ? "bg-naija-green text-white"
                  : "bg-black/50 text-white hover:bg-black/70"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill={isSaved ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              aria-label="Share listing"
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-naija-green focus:ring-offset-2 focus:ring-offset-dark-bg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </motion.button>

            {/* Compare Button - Requirements: 3.2 */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCompare}
              aria-label={
                inComparison ? "Remove from comparison" : "Add to comparison"
              }
              aria-pressed={inComparison}
              className={`p-2 rounded-full backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-bg ${
                inComparison
                  ? "bg-neon-cyan text-dark-bg"
                  : "bg-black/50 text-white hover:bg-black/70"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3
            id={`listing-title-${listing.id}`}
            className="font-semibold text-lg mb-1 line-clamp-2"
          >
            {listing.title}
          </h3>

          {listing.price && (
            <PriceDisplay amount={listing.price} size="lg" className="mb-2" />
          )}

          <p className="text-gray-400 text-sm line-clamp-2 mb-3">
            {listing.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              {listing.user?.avatar_url ? (
                <Image
                  src={listing.user.avatar_url}
                  alt={listing.user.username}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-dark-card flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <span>{listing.user?.username}</span>
              {/* Task 8.14: Display VendorBadge for approved vendors */}
              {(listing as any).vendor?.approved_badge_enabled && (
                <VendorBadge size="sm" showLabel={false} />
              )}
              {/* Verification Badge - Requirements: 15.1, 15.8 */}
              {badge && badge.tier !== "none" && (
                <VerificationBadge
                  tier={badge.tier}
                  phoneVerified={badge.phoneVerified}
                  ninVerified={badge.ninVerified}
                  videoVerified={badge.videoVerified}
                  transactionCount={badge.transactionCount}
                  averageRating={badge.averageRating}
                />
              )}
              {/* Premium Badge - Requirements: 24.4 */}
              {listing.user?.is_premium && listing.user?.premium_tier && (
                <PremiumBadge plan={listing.user.premium_tier} size="sm" />
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                {listing.views_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {listing.likes_count || 0}
              </span>
            </div>
          </div>

          {/* Location */}
          <LocationDisplay
            state={listing.state}
            area={listing.lga}
            className="mt-2"
            iconClassName="w-3 h-3 text-gray-500"
            textClassName="text-xs text-gray-500"
          />
        </div>
      </motion.div>
    </Link>
  );
}
