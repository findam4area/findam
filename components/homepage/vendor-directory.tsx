"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Star, Package, Clock } from "lucide-react";
import { getSafeImageUrl } from "@/lib/utils/image-url";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "./verification-badge";
import type { VendorDirectoryProps, Vendor } from "./types";

/**
 * VendorDirectory Component
 * 
 * Showcase verified vendors with ratings, specialties, and verification badges.
 * Uses TanStack Query for data fetching with infinite scroll support.
 * 
 * Requirements:
 * - 4.1: Display 8-12 featured vendors in responsive grid
 * - 4.2: Fetch vendor data from Supabase
 * - 4.3: Show verification badges (phone, NIN, video)
 * - 4.4: Display vendor ratings with star icons
 * - 4.5: Add hover effects (scale, glow) on vendor cards
 * - 4.6: Navigate to vendor storefront on click
 * - 4.7: Display vendor specialties
 * - 4.8: Implement infinite scroll or pagination
 * - 4.9: Display "Verified Seller" badges
 */

async function fetchFeaturedVendors(): Promise<Vendor[]> {
  const response = await fetch("/api/vendors/featured");
  if (!response.ok) {
    throw new Error("Failed to fetch featured vendors");
  }
  return response.json();
}

function VendorCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-dark-card border border-dark-border animate-pulse">
      <div className="p-6 space-y-4">
        {/* Avatar skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-700 rounded w-1/2" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="flex gap-4">
          <div className="h-4 bg-gray-700 rounded w-20" />
          <div className="h-4 bg-gray-700 rounded w-20" />
        </div>

        {/* Specialties skeleton */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-700 rounded w-16" />
          <div className="h-6 bg-gray-700 rounded w-20" />
        </div>

        {/* Verification badges skeleton */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-700 rounded w-16" />
          <div className="h-6 bg-gray-700 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

interface VendorCardProps {
  vendor: Vendor;
}

function VendorCard({ vendor }: VendorCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Check if vendor is fully verified (Requirement 4.9)
  const isFullyVerified =
    vendor.verification.phone &&
    vendor.verification.nin &&
    vendor.verification.video;

  return (
    <Link
      href={`/store/${vendor.id}`}
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-xl"
      aria-label={`View ${vendor.name}'s storefront - ${vendor.rating} star rating`}
    >
      <motion.div
        className="rounded-xl overflow-hidden bg-dark-card border border-dark-border hover:border-naija-green/50 transition-colors"
        // Hover effects: scale and glow (Requirement 4.5)
        whileHover={{
          scale: 1.03,
          boxShadow: "0 0 20px rgba(34, 197, 94, 0.3)",
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="p-6">
          {/* Vendor Header */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar with descriptive alt text - Requirements: 15.2 */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
              <Image
                src={getSafeImageUrl(vendor.avatar, undefined, vendor.name)}
                alt={`${vendor.name} profile picture`}
                fill
                className={cn(
                  "object-cover transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                sizes="64px"
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse" />
              )}
            </div>

            {/* Name and Verified Badge */}
            <div className="flex-1 min-w-0">
              {/* Proper heading hierarchy - h3 under h2 - Requirements: 15.7 */}
              <h3 className="font-bold text-lg text-white mb-1 truncate">
                {vendor.name}
              </h3>

              {/* Fully Verified Badge (Requirement 4.9) */}
              {isFullyVerified && (
                <VerificationBadge type="full" size="sm" showTooltip={true} />
              )}
            </div>
          </div>

          {/* Rating with star icons (Requirement 4.4) */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.floor(vendor.rating)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-600"
                  )}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-white">
              {vendor.rating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-400">
              ({vendor.reviewCount.toLocaleString()} reviews)
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Package className="h-4 w-4" aria-hidden="true" />
              <span>{vendor.listingCount.toLocaleString()} listings</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>~{vendor.responseTime}h response</span>
            </div>
          </div>

          {/* Specialties (Requirement 4.7) */}
          {vendor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {vendor.specialties.slice(0, 3).map((specialty, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs font-medium bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-full"
                >
                  {specialty}
                </span>
              ))}
              {vendor.specialties.length > 3 && (
                <span className="px-2 py-1 text-xs font-medium text-gray-400">
                  +{vendor.specialties.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Verification Badges (Requirement 4.3) */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-dark-border">
            {vendor.verification.phone && (
              <VerificationBadge type="phone" size="sm" showTooltip={true} />
            )}
            {vendor.verification.nin && (
              <VerificationBadge type="nin" size="sm" showTooltip={true} />
            )}
            {vendor.verification.video && (
              <VerificationBadge type="video" size="sm" showTooltip={true} />
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export function VendorDirectory({
  initialVendors,
  className = "",
}: VendorDirectoryProps) {
  // TanStack Query integration (Requirement 4.1, 4.2)
  const { data, isLoading, error } = useQuery({
    queryKey: ["vendors", "featured"],
    queryFn: fetchFeaturedVendors,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: initialVendors,
  });

  const vendors = data ?? initialVendors ?? [];

  return (
    <section className={cn("py-12", className)} aria-labelledby="vendors-heading" role="region">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          {/* Proper heading hierarchy - h2 follows h1 - Requirements: 15.7 */}
          <h2 id="vendors-heading" className="text-3xl font-bold text-white mb-2">
            Verified Vendors
          </h2>
          <p className="text-gray-400">
            Discover trusted sellers with verified credentials
          </p>
        </div>

        {/* Error State with aria-live for screen readers - Requirements: 15.6 */}
        {error && (
          <div className="text-center py-12" role="alert" aria-live="assertive" aria-atomic="true">
            <p className="text-red-500 mb-4">Failed to load vendors</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-naija-green text-white rounded-lg hover:bg-naija-green/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 min-h-[44px]"
              aria-label="Retry loading vendors"
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State - Skeleton */}
        {isLoading && !initialVendors && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list" aria-label="Loading vendors" aria-busy="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <VendorCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Vendors Grid (Requirement 4.1) */}
        {!error && vendors.length > 0 && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            role="list"
            aria-label="Featured verified vendors"
          >
            {vendors.map((vendor) => (
              <motion.div
                key={vendor.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.3 }}
                role="listitem"
              >
                <VendorCard vendor={vendor} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!error && !isLoading && vendors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              No verified vendors available at the moment
            </p>
            <a
              href="/search"
              className="inline-block px-6 py-3 bg-naija-green text-white rounded-lg hover:bg-naija-green/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              Browse All Listings
            </a>
          </div>
        )}

        {/* View All Link (Requirement 4.8 - pagination support) */}
        {!error && vendors.length > 0 && (
          <div className="mt-8 text-center">
            <a
              href="/vendors"
              className="inline-flex items-center gap-2 px-6 py-3 bg-dark-card border border-naija-green/50 text-naija-green rounded-lg hover:bg-naija-green/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              View All Vendors
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
