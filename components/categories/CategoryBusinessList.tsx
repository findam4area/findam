"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { BusinessProfile } from "@/lib/types/business-profile";
import { MapPin, Star, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface CategoryBusinessListProps {
  businesses: BusinessProfile[];
  total: number;
  page?: number;
  limit?: number;
  sortBy?: "rating" | "review_count" | "name";
  onSortChange?: (sort: "rating" | "review_count" | "name") => void;
  onPageChange?: (page: number) => void;
}

/**
 * CategoryBusinessList component displays businesses for selected category/subcategory
 * Requirements: 3.3, 3.7
 * Features:
 * - Display business cards with primary photo, name, rating, price range
 * - Support pagination with prev/next controls
 * - Support sorting (rating, review_count, name)
 * - Display zero results message when appropriate
 * - Fully keyboard accessible with proper ARIA labels
 * - Shows verified and premium badges
 */
export function CategoryBusinessList({
  businesses,
  total,
  page = 1,
  limit = 12,
  sortBy = "rating",
  onSortChange,
  onPageChange,
}: CategoryBusinessListProps) {
  const [currentSort, setCurrentSort] = useState(sortBy);

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const handleSortChange = (newSort: "rating" | "review_count" | "name") => {
    setCurrentSort(newSort);
    if (onSortChange) {
      onSortChange(newSort);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  // Zero results state
  if (businesses.length === 0) {
    return (
      <div className="text-center py-16 glass-card rounded-2xl">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-bold text-white mb-2">
          No businesses found
        </h3>
        <p className="text-gray-400 mb-6">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-white">
          <span className="text-lg font-semibold">{total}</span>
          <span className="text-gray-400 ml-2">
            {total === 1 ? "business" : "businesses"} found
          </span>
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          <div className="flex gap-2">
            <SortButton
              active={currentSort === "rating"}
              onClick={() => handleSortChange("rating")}
            >
              Rating
            </SortButton>
            <SortButton
              active={currentSort === "review_count"}
              onClick={() => handleSortChange("review_count")}
            >
              Reviews
            </SortButton>
            <SortButton
              active={currentSort === "name"}
              onClick={() => handleSortChange("name")}
            >
              Name
            </SortButton>
          </div>
        </div>
      </div>

      {/* Business Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((business, index) => (
          <BusinessCard key={business.id} business={business} index={index} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={!hasPrevPage}
            className="glass-card px-4 py-2 rounded-lg flex items-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (page <= 3) {
                pageNumber = i + 1;
              } else if (page >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = page - 2 + i;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                    page === pageNumber
                      ? "bg-neon-cyan text-dark-bg"
                      : "glass-card text-white hover:bg-white/10"
                  }`}
                  aria-label={`Page ${pageNumber}`}
                  aria-current={page === pageNumber ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={!hasNextPage}
            className="glass-card px-4 py-2 rounded-lg flex items-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            aria-label="Next page"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

interface SortButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function SortButton({ active, onClick, children }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-neon-cyan text-dark-bg"
          : "glass-card text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

interface BusinessCardProps {
  business: BusinessProfile;
  index: number;
}

function BusinessCard({ business, index }: BusinessCardProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4 }}
      className="glass-card group relative overflow-hidden rounded-2xl transition-all duration-300"
    >
      <Link href={`/business/${business.id}`} className="block">
        {/* Business Image */}
        <div className="relative h-48 bg-gray-800 overflow-hidden">
          {business.primary_photo_url ? (
            <Image
              src={business.primary_photo_url}
              alt={business.business_name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {business.primary_category?.icon || "🏢"}
            </div>
          )}

          {/* Verified Badge */}
          {business.is_verified && (
            <div className="absolute top-3 right-3 bg-neon-cyan text-dark-bg px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              ✓ Verified
            </div>
          )}

          {/* Premium Badge */}
          {business.is_premium && (
            <div className="absolute top-3 left-3 bg-yellow-500 text-dark-bg px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              ⭐ Premium
            </div>
          )}
        </div>

        {/* Business Info */}
        <div className="p-5 space-y-3">
          {/* Name */}
          <h3 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors line-clamp-2">
            {business.business_name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-white font-semibold">
                {business.average_rating.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-400 text-sm">
              ({business.review_count} {business.review_count === 1 ? "review" : "reviews"})
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">
              {business.city}, {business.state}
            </span>
          </div>

          {/* Price Range */}
          {business.price_range && (
            <div className="flex items-center gap-2 text-neon-cyan text-sm font-semibold">
              <DollarSign className="w-4 h-4" />
              <span>{business.price_range}</span>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-400 text-sm line-clamp-2">
            {business.description}
          </p>
        </div>

        {/* Hover effect border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-neon-cyan/0 group-hover:border-neon-cyan/50 transition-all duration-300 pointer-events-none" />
      </Link>
    </motion.div>
  );
}

