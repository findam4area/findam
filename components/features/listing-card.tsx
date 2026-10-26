/**
 * ListingCard Component (Server Component)
 * 
 * Displays an individual listing card with:
 * - Primary image with fallback
 * - Title, price, location
 * - Category badge
 * - Vendor badge (if applicable)
 * - Status badge (for user's own listings)
 * 
 * Requirements: 5.3, 13.12, 4.5
 * Task: 8.14 - Integrate VendorBadge component
 */

import Image from "next/image";
import Link from "next/link";
import type { ListingWithRelations } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import { MapPin, Clock } from "lucide-react";
import { VendorBadge } from "@/components/shared/vendor-badge";
import { generateListingImageAlt } from "@/lib/utils/accessibility";
import { getSafeImageUrl } from "@/lib/utils/image-url";

interface ListingCardProps {
  listing: ListingWithRelations;
  showStatus?: boolean;
  priority?: boolean;
}

export function ListingCard({ 
  listing, 
  showStatus = false,
  priority = false 
}: ListingCardProps) {
  // Get primary image URL with validation
  const primaryImageUrl = listing.images?.[listing.primary_image_index] || listing.images?.[0];
  const imageUrl = getSafeImageUrl(primaryImageUrl, undefined, listing.title);
  
  // Format price
  const formattedPrice = listing.price 
    ? new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
      }).format(listing.price)
    : 'Contact for price';

  // Status badge colors
  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    approved: 'bg-green-500/10 text-green-500 border-green-500/30',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/30'
  };

  return (
    <div className="group h-full">
      <Link
        href={`/listing/${listing.id}`}
        className={cn(
          "block relative overflow-hidden rounded-xl bg-gray-900/50",
          "border border-gray-800 hover:border-primary-500/50",
          "transition-all duration-300 h-full flex flex-col",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
          "hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1"
        )}
        aria-label={`View listing: ${listing.title}`}
      >
        {/* Listing Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-800">
          <Image
            src={imageUrl}
            alt={generateListingImageAlt(
              listing.title,
              listing.primary_image_index,
              listing.images?.length || 1
            )}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              "object-cover transition-transform duration-300",
              "group-hover:scale-110"
            )}
            priority={priority}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg=="
          />
          
          {/* Overlay gradient */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent opacity-40 group-hover:opacity-20 transition-opacity duration-300" 
            aria-hidden="true"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            {/* Category badge */}
            {listing.category && (
              <span className="px-2 py-1 bg-gray-900/80 backdrop-blur-sm rounded-md border border-gray-700 text-xs font-medium text-gray-200">
                {listing.category.name}
              </span>
            )}
            
            {/* Vendor badge - Task 8.14: Use VendorBadge component */}
            {listing.vendor?.approved_badge_enabled && (
              <VendorBadge size="sm" />
            )}
          </div>

          {/* Status badge (for user's own listings) */}
          {showStatus && (
            <div className="absolute bottom-3 right-3">
              <div className={cn(
                "px-3 py-1 rounded-full border backdrop-blur-sm text-xs font-medium capitalize",
                statusColors[listing.status]
              )}>
                {listing.status}
              </div>
            </div>
          )}

          {/* Image count indicator */}
          {listing.images && listing.images.length > 1 && (
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-gray-900/80 backdrop-blur-sm rounded-md border border-gray-700 flex items-center gap-1">
              <div className="flex gap-0.5">
                {listing.images.slice(0, 4).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 w-1 rounded-full",
                      i === listing.primary_image_index ? "bg-primary-400" : "bg-gray-500"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-gray-300 ml-1">
                {listing.images.length}
              </span>
            </div>
          )}
        </div>

        {/* Listing Info */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors duration-200 line-clamp-2 mb-2">
            {listing.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
            <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">
              {listing.location_city}, {listing.location_state}
            </span>
          </div>

          {/* Price */}
          <div className="mt-auto">
            <p className="text-xl font-bold text-primary-400">
              {formattedPrice}
            </p>
          </div>

          {/* Posted time */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>
              {new Date(listing.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </Link>
    </div>
  );
}
