"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, Bookmark, Eye, Play, MapPin } from "lucide-react";
import { useOffline } from "@/lib/hooks/useOffline";
import { toast } from "sonner";
import type { ListingCardProps } from "./types";
import { VendorBadge } from "@/components/shared/vendor-badge";
import { getSafeImageUrl } from "@/lib/utils/image-url";

/**
 * ListingCard Component
 * 
 * Reusable card component for displaying listings with hover effects and interactions.
 * Includes offline support for likes and saves.
 * 
 * Requirements:
 * - 3.2: Display thumbnail, title, price, location, views, likes
 * - 3.3: Hover effects (translateY -4px, shadow, overlay)
 * - 3.4: Video play button overlay for listings with videos
 * - 3.10: Support keyboard navigation and screen reader announcements
 * - 17.4: Queue user actions (likes, saves) when offline
 */
export function ListingCard({
  listing,
  variant = "default",
  showVendor = true,
  onLike,
  onSave,
  className = "",
}: ListingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isOnline, queueAction } = useOffline();

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If offline, queue the action (Requirement 17.4)
    if (!isOnline) {
      await queueAction(
        `/api/listings/${listing.id}/like`,
        "POST",
        {},
        { "Content-Type": "application/json" }
      );
      return;
    }
    
    // If online, execute immediately
    onLike?.(listing.id);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If offline, queue the action (Requirement 17.4)
    if (!isOnline) {
      await queueAction(
        `/api/listings/${listing.id}/save`,
        "POST",
        {},
        { "Content-Type": "application/json" }
      );
      return;
    }
    
    // If online, execute immediately
    onSave?.(listing.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  const cardVariants = {
    default: "rounded-lg overflow-hidden bg-card border",
    compact: "rounded-md overflow-hidden bg-card border",
    featured: "rounded-xl overflow-hidden bg-card border-2 border-primary/20",
  };

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
      aria-label={`View ${listing.title} - ${listing.currency} ${listing.price.toLocaleString()}`}
    >
      <motion.div
        className={`${cardVariants[variant]} ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        // Hover effects: lift and shadow (Requirement 3.3)
        whileHover={{
          y: -4,
          transition: { duration: 0.2 },
        }}
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {/* Listing Image with lazy loading and descriptive alt text - Requirements: 15.2 */}
          <Image
            src={getSafeImageUrl(listing.thumbnail, undefined, listing.title)}
            alt={`${listing.title} - ${listing.currency} ${listing.price.toLocaleString()} in ${listing.location}`}
            fill
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Blur placeholder while loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse" />
          )}

          {/* Video play button overlay (Requirement 3.4) with proper ARIA - Requirements: 15.5 */}
          {listing.video && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              role="button"
              aria-label="Play video preview"
            >
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-8 h-8 text-primary ml-1" fill="currentColor" aria-hidden="true" role="img" aria-label="Play icon" />
              </div>
            </motion.div>
          )}

          {/* Boost Badge (Requirement 3.5) with proper aria - Requirements: 15.5 */}
          {listing.isBoosted && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold" role="status" aria-label="Boosted listing">
              Boosted
            </div>
          )}

          {/* Hover Overlay (Requirement 3.3) */}
          <motion.div
            className="absolute inset-0 bg-black/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Action Buttons with proper ARIA labels - Requirements: 15.5 */}
          <motion.div
            className="absolute top-2 right-2 flex gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : -10 }}
            transition={{ duration: 0.2 }}
            role="group"
            aria-label="Listing actions"
          >
            <button
              onClick={handleLike}
              onKeyDown={(e) => handleKeyDown(e, () => handleLike(e as any))}
              className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px]"
              aria-label="Like this listing"
              type="button"
            >
              <Heart className="w-4 h-4 text-red-500" aria-hidden="true" role="img" aria-label="Heart icon" />
            </button>
            <button
              onClick={handleSave}
              onKeyDown={(e) => handleKeyDown(e, () => handleSave(e as any))}
              className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px]"
              aria-label="Save this listing"
              type="button"
            >
              <Bookmark className="w-4 h-4 text-primary" aria-hidden="true" role="img" aria-label="Bookmark icon" />
            </button>
          </motion.div>
        </div>

        {/* Card Content */}
        <div className="p-4">
          {/* Title (Requirement 3.2) - h3 heading hierarchy - Requirements: 15.7 */}
          <h3 className="font-semibold text-base mb-2 line-clamp-2">
            {listing.title}
          </h3>

          {/* Price (Requirement 3.2) */}
          <p className="text-lg font-bold text-primary mb-2" aria-label={`Price: ${listing.currency} ${listing.price.toLocaleString()}`}>
            {listing.currency} {listing.price.toLocaleString()}
          </p>

          {/* Location (Requirement 3.2) */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="w-4 h-4" aria-hidden="true" role="img" aria-label="Location icon" />
            <span>{listing.location}</span>
          </div>

          {/* Stats: Views and Likes (Requirement 3.2) */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3" role="group" aria-label="Listing statistics">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" aria-hidden="true" role="img" aria-label="Eye icon" />
              <span aria-label={`${listing.views.toLocaleString()} views`}>{listing.views.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" aria-hidden="true" role="img" aria-label="Heart icon" />
              <span aria-label={`${listing.likes.toLocaleString()} likes`}>{listing.likes.toLocaleString()}</span>
            </div>
          </div>

          {/* Vendor Info (Requirement 3.2, 4.5) with descriptive alt text - Requirements: 15.2 */}
          {showVendor && (
            <div className="flex items-center gap-2 pt-3 border-t">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted">
                <Image
                  src={getSafeImageUrl(listing.vendor.avatar, undefined, listing.vendor.name)}
                  alt={`${listing.vendor.name} profile picture`}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {listing.vendor.name}
                </p>
              </div>
              {/* Task 8.14: Display VendorBadge for approved vendors */}
              {listing.vendor.isVerified && (
                <VendorBadge size="sm" showLabel={false} />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
