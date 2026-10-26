"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Star,
  BadgeCheck,
  Crown,
  Phone,
  Mail,
  Globe,
  Navigation,
  Package,
  Store,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BusinessProfile } from "@/lib/types/business-profile";

interface SearchResultsProps {
  businesses: (BusinessProfile & { distance_km?: number })[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  searchMetadata?: {
    query_time_ms: number;
    total_results: number;
    using_vector_search: boolean;
  };
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

/**
 * SearchResults component for displaying business search results
 * 
 * Features:
 * - Grid layout for business cards (responsive)
 * - Distance display from user location (if location filter applied)
 * - Premium business highlighting
 * - Verified business badges
 * - Matched search terms highlighting
 * - Pagination controls
 * - Zero results message
 * - Search metadata display
 * 
 * Requirements: 4.3, 4.5, 6.5, 7.6
 */
export function SearchResults({
  businesses,
  total,
  page,
  limit,
  hasMore,
  searchMetadata,
  onPageChange,
  isLoading = false,
}: SearchResultsProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (businessId: string) => {
    setImageErrors((prev) => new Set(prev).add(businessId));
  };

  const handlePrevPage = () => {
    if (page > 1 && onPageChange) {
      onPageChange(page - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (hasMore && onPageChange) {
      onPageChange(page + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Zero results state
  if (!isLoading && businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="bg-dark-card border-2 border-dashed border-dark-border rounded-xl p-12 max-w-md">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No businesses found
          </h3>
          <p className="text-gray-400 mb-6">
            We couldn&apos;t find any businesses matching your search criteria. Try
            adjusting your filters or search terms.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-dark-border hover:bg-dark-bg"
          >
            Clear Filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Metadata */}
      {searchMetadata && (
        <div className="flex items-center justify-between text-sm text-gray-400 pb-4 border-b border-dark-border">
          <div>
            <span className="text-white font-medium">{total}</span> businesses
            found
            {searchMetadata.query_time_ms > 0 && (
              <span className="ml-2">
                in {searchMetadata.query_time_ms}ms
              </span>
            )}
          </div>
          {searchMetadata.using_vector_search && (
            <Badge variant="outline" className="border-purple-500 text-purple-400">
              AI-Powered
            </Badge>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-dark-card border border-dark-border rounded-xl overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-dark-bg" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-dark-bg rounded w-3/4" />
                <div className="h-3 bg-dark-bg rounded w-full" />
                <div className="h-3 bg-dark-bg rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Business Grid */}
      {!isLoading && (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {businesses.map((business) => (
              <motion.div
                key={business.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <BusinessCard
                  business={business}
                  hasImageError={imageErrors.has(business.id)}
                  onImageError={() => handleImageError(business.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination Controls */}
      {!isLoading && businesses.length > 0 && (
        <div className="flex items-center justify-between pt-6 border-t border-dark-border">
          <div className="text-sm text-gray-400">
            Showing {(page - 1) * limit + 1} to{" "}
            {Math.min(page * limit, total)} of {total} businesses
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={page === 1}
              className="border-dark-border hover:bg-dark-bg disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, Math.ceil(total / limit)) }, (_, i) => {
                const pageNum = i + 1;
                const isCurrentPage = pageNum === page;

                return (
                  <Button
                    key={pageNum}
                    variant={isCurrentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange && onPageChange(pageNum)}
                    className={
                      isCurrentPage
                        ? "bg-neon-cyan text-dark-bg hover:bg-neon-cyan/90"
                        : "border-dark-border hover:bg-dark-bg"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasMore}
              className="border-dark-border hover:bg-dark-bg disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * BusinessCard component for displaying individual business in search results
 */
interface BusinessCardProps {
  business: BusinessProfile & { distance_km?: number };
  hasImageError: boolean;
  onImageError: () => void;
}

function BusinessCard({ business, hasImageError, onImageError }: BusinessCardProps) {
  const displayName = business.display_name || business.business_name;
  const hasLocation = business.distance_km !== undefined;

  return (
    <Link
      href={`/business-profiles/${business.id}`}
      className="block group"
    >
      <div
        className={`
        bg-dark-card border rounded-xl overflow-hidden 
        transition-all duration-300 h-full
        hover:shadow-xl hover:-translate-y-1
        ${
          business.is_premium
            ? "border-yellow-500/50 shadow-lg shadow-yellow-500/10"
            : "border-dark-border"
        }
      `}
      >
        {/* Image Section */}
        <div className="relative h-48 bg-dark-bg overflow-hidden">
          {business.primary_photo_url && !hasImageError ? (
            <Image
              src={business.primary_photo_url}
              alt={displayName}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              onError={onImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-dark-bg to-dark-card">
              <Store className="h-16 w-16 text-gray-600" />
            </div>
          )}

          {/* Premium Badge Overlay */}
          {business.is_premium && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-yellow-500/90 text-dark-bg border-0 font-semibold backdrop-blur-sm">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
          )}

          {/* Verified Badge Overlay */}
          {business.is_verified && (
            <div className="absolute top-3 right-3">
              <div className="bg-blue-500/90 backdrop-blur-sm rounded-full p-1.5">
                <BadgeCheck className="h-4 w-4 text-white" />
              </div>
            </div>
          )}

          {/* Distance Badge */}
          {hasLocation && (
            <div className="absolute bottom-3 right-3">
              <Badge className="bg-dark-bg/80 backdrop-blur-sm border-dark-border">
                <Navigation className="h-3 w-3 mr-1" />
                {business.distance_km} km
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Business Name and Type */}
          <div>
            <h3 className="text-lg font-semibold text-white line-clamp-1 group-hover:text-neon-cyan transition-colors">
              {displayName}
            </h3>
            {business.primary_category && (
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                <Package className="h-3 w-3" />
                {business.primary_category.name}
              </p>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-300 line-clamp-2">
            {business.description}
          </p>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {business.city}, {business.state}
            </span>
          </div>

          {/* Rating and Reviews */}
          {business.review_count > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-white">
                  {business.average_rating.toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-gray-400">
                ({business.review_count} {business.review_count === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          {/* Price Range */}
          {business.price_range && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Price:</span>
              <span className="text-sm font-medium text-green-400">
                {business.price_range}
              </span>
            </div>
          )}

          {/* Service Attributes */}
          {business.service_attributes && (
            <div className="flex flex-wrap gap-1.5">
              {business.service_attributes.delivery_available && (
                <Badge variant="outline" className="text-xs border-dark-border">
                  Delivery
                </Badge>
              )}
              {business.service_attributes.online_service && (
                <Badge variant="outline" className="text-xs border-dark-border">
                  Online
                </Badge>
              )}
              {business.service_attributes.availability_24_7 && (
                <Badge variant="outline" className="text-xs border-dark-border">
                  24/7
                </Badge>
              )}
            </div>
          )}

          {/* Contact Icons (Hidden on Mobile, Shown on Hover) */}
          <div className="flex items-center gap-2 pt-2 border-t border-dark-border opacity-0 group-hover:opacity-100 transition-opacity">
            {business.phone && (
              <div className="text-gray-400 hover:text-neon-cyan transition-colors">
                <Phone className="h-4 w-4" />
              </div>
            )}
            {business.email && (
              <div className="text-gray-400 hover:text-neon-cyan transition-colors">
                <Mail className="h-4 w-4" />
              </div>
            )}
            {business.website && (
              <div className="text-gray-400 hover:text-neon-cyan transition-colors">
                <Globe className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
