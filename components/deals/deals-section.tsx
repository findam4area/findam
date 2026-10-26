/**
 * DealsSection Component
 * 
 * Displays "Deals of the Day" section with discounted listings and countdown timers.
 * 
 * Requirements:
 * - 13.1: Display "Deals of the Day" section with 4-8 discounted listings
 * - 13.2: Fetch deals where discount_percentage > 0
 * - 13.3: Display original price, discounted price, and discount percentage
 * - 13.4: Display countdown timers for time-limited deals
 * - 13.5: Auto-remove expired deals
 * - 13.6: Display deal badges with prominent styling
 * - 13.7: Sort deals by discount percentage or expiration time
 * - 13.9: Update timers every second
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Clock, Tag, TrendingDown, MapPin, Eye, Heart } from "lucide-react";
import { useCountdown } from "./useCountdown";
import { cn } from "@/lib/utils";
import {
  getOptimizedImageProps,
  shouldPrioritize,
} from "@/lib/utils/image-optimization";

/**
 * Deal interface matching design document
 */
export interface Deal {
  id: string;
  listing: {
    id: string;
    title: string;
    thumbnail: string;
    location: string;
    views: number;
    likes: number;
    vendor: {
      id: string;
      name: string;
      avatar: string;
      isVerified: boolean;
    };
  };
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  expiresAt: string;
}

export interface DealsSectionProps {
  initialDeals?: Deal[];
  className?: string;
}

/**
 * Individual Deal Card with countdown timer
 */
function DealCard({ deal, index = 0 }: { deal: Deal; index?: number }) {
  const timeLeft = useCountdown(deal.expiresAt);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Don't render if expired (Requirement 13.5)
  if (timeLeft.total <= 0) {
    return null;
  }

  return (
    <Link
      href={`/listing/${deal.listing.id}`}
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
      aria-label={`View deal: ${deal.listing.title} - ${deal.discountPercentage}% off`}
    >
      <motion.div
        className="rounded-xl overflow-hidden bg-card border-2 border-primary/20 hover:border-primary/40 transition-colors"
        whileHover={{
          y: -4,
          transition: { duration: 0.2 },
        }}
        layout
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {/* Deal Image */}
          <Image
            {...getOptimizedImageProps(
              deal.listing.thumbnail,
              shouldPrioritize(index, 4), // First 4 deals are above fold
              "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            )}
            alt={deal.listing.title}
            fill
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Blur placeholder while loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 animate-pulse" />
          )}

          {/* Deal Badge (Requirement 13.6) */}
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-sm shadow-lg flex items-center gap-1.5" role="status" aria-label={`${deal.discountPercentage}% discount`}>
            <Tag className="w-4 h-4" aria-hidden="true" />
            <span>{deal.discountPercentage}% OFF</span>
          </div>

          {/* Countdown Timer (Requirement 13.4) */}
          <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg bg-black/80 backdrop-blur-sm text-white" role="timer" aria-live="off" aria-label={`Deal ends in ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span className="text-xs font-medium">Ends in:</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold tabular-nums" aria-hidden="true">
                {timeLeft.days > 0 && (
                  <>
                    <span>{timeLeft.days}d</span>
                    <span className="text-white/60">:</span>
                  </>
                )}
                <span>{String(timeLeft.hours).padStart(2, "0")}h</span>
                <span className="text-white/60">:</span>
                <span>{String(timeLeft.minutes).padStart(2, "0")}m</span>
                <span className="text-white/60">:</span>
                <span>{String(timeLeft.seconds).padStart(2, "0")}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-base mb-3 line-clamp-2">
            {deal.listing.title}
          </h3>

          {/* Prices (Requirement 13.3) */}
          <div className="flex items-baseline gap-2 mb-3">
            <p className="text-2xl font-bold text-primary">
              ₦{deal.discountedPrice.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground line-through">
              ₦{deal.originalPrice.toLocaleString()}
            </p>
          </div>

          {/* Savings Badge */}
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold mb-3">
            <TrendingDown className="w-3 h-3" />
            <span>
              Save ₦{(deal.originalPrice - deal.discountedPrice).toLocaleString()}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="w-4 h-4" />
            <span>{deal.listing.location}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{deal.listing.views.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{deal.listing.likes.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/**
 * DealsSection Component
 * 
 * Displays deals with automatic expiration handling and sorting
 */
export function DealsSection({
  initialDeals = [],
  className = "",
}: DealsSectionProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [isLoading, setIsLoading] = useState(!initialDeals.length);

  // Fetch deals on mount if no initial deals provided
  useEffect(() => {
    if (!initialDeals.length) {
      fetchDeals();
    }
  }, [initialDeals.length]);

  // Auto-remove expired deals (Requirement 13.5)
  useEffect(() => {
    const interval = setInterval(() => {
      setDeals((currentDeals) =>
        currentDeals.filter((deal) => new Date(deal.expiresAt).getTime() > Date.now())
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Fetch deals from API (Requirement 13.2)
   * Fetches deals where discount_percentage > 0
   */
  async function fetchDeals() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/deals?discount_gt=0&limit=8");
      
      if (!response.ok) {
        throw new Error("Failed to fetch deals");
      }

      const data = await response.json();
      
      // Sort by discount percentage descending (Requirement 13.7)
      const sortedDeals = data.deals.sort(
        (a: Deal, b: Deal) => b.discountPercentage - a.discountPercentage
      );
      
      setDeals(sortedDeals);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Don't render section if no deals available
  if (!isLoading && deals.length === 0) {
    return null;
  }

  return (
    <section className={cn("py-12 px-4 md:px-6 lg:px-8", className)} aria-labelledby="deals-heading" role="region">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 id="deals-heading" className="text-3xl font-bold mb-2">Deals of the Day</h2>
            <p className="text-muted-foreground">
              Limited time offers - grab them before they expire!
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-label="Deals updated every hour">
            <Clock className="w-4 h-4" aria-hidden="true" />
            <span>Updated every hour</span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="list" aria-label="Loading deals" aria-busy="true">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden bg-card border animate-pulse"
              >
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-6 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Deals Grid (Requirement 13.1) */}
        {!isLoading && (
          <AnimatePresence mode="popLayout">
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              layout
              role="list"
              aria-label="Active deals"
              aria-live="polite"
            >
              {deals.map((deal, index) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <DealCard deal={deal} index={index} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {!isLoading && deals.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No active deals right now</h3>
            <p className="text-muted-foreground">
              Check back soon for amazing discounts!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
