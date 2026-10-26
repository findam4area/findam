"use client";

/**
 * CategoryCard Component
 * 
 * Displays an individual category card with:
 * - Category image with fallback
 * - Category name
 * - Listing count
 * - Category badges (Popular, Recently Updated, New, Subcategories)
 * - Keyboard navigation support
 * - Hover effects and accessibility
 * 
 * Requirements: 1.4, 1.6, 1.7, 4.2, 4.3, 4.5
 */

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Flame, Clock, Sparkles, ChevronRight } from "lucide-react";
import type { Category } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import { getCategoryBadges, type CategoryBadges } from "@/lib/utils/categories";

interface CategoryCardProps {
  category: Category;
  index?: number;
  subcategoryCount?: number;
}

export function CategoryCard({ category, index = 0, subcategoryCount = 0 }: CategoryCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion();

  // Calculate badges based on category data
  const badges = useMemo<CategoryBadges>(() => getCategoryBadges(category, subcategoryCount),
    [category, subcategoryCount]
  );

  // Animation variants - respect prefers-reduced-motion
  const animationVariants = {
    initial: prefersReducedMotion 
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  // Transition config - faster when reduced motion is preferred
  const animationTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.4, delay: index * 0.1 };

  // Placeholder image for categories without images or when image fails to load
  // Use a solid color gradient placeholder instead of external service
  const placeholderImage = `https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=300&fit=crop`;

  // Validate and sanitize image URL
  const getValidImageUrl = () => {
    // If there was an error or no image_url, use placeholder
    if (imageError || !category.image_url) {
      return placeholderImage;
    }

    // Check if image_url is a valid URL (local path or external URL)
    if (typeof category.image_url === 'string') {
      // Local path (starts with /)
      if (category.image_url.startsWith('/')) {
        return category.image_url;
      }
      // External URL (starts with http:// or https://)
      if (category.image_url.startsWith('http://') || category.image_url.startsWith('https://')) {
        return category.image_url;
      }
    }

    // If image_url is invalid (like an icon name), use placeholder
    console.warn(`Invalid image_url for category "${category.name}": "${category.image_url}"`);
    return placeholderImage;
  };

  const imageSrc = getValidImageUrl();

  return (
    // @ts-expect-error - Framer Motion complex type inference
    <motion.div
      initial={animationVariants.initial}
      animate={animationVariants.animate}
      transition={animationTransition}
      className="group relative"
    >
      {/* Gradient border effect using pseudo-element */}
      <div 
        className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
        aria-hidden="true"
      />
      
      <Link
        href={`/categories/${category.slug}`}
        className={cn(
          "block relative overflow-hidden rounded-xl bg-gray-900/50",
          "border border-gray-800 hover:border-primary-500/50",
          "transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
          "hover:shadow-xl hover:shadow-primary-500/10 hover:scale-105",
          // Touch target minimum 44x44px on mobile - Requirement 8.2, 8.3, 9.5
          "min-h-touch min-w-touch",
          // Tap animation on mobile - scale down to 0.98 (respects reduced motion) - Requirement 9.3
          !prefersReducedMotion && "active:scale-[0.98] active:ring-2 active:ring-primary-500"
        )}
        tabIndex={0}
        aria-label={`Browse ${category.name} category with ${category.listing_count} ${category.listing_count === 1 ? 'listing' : 'listings'}${subcategoryCount > 0 ? ` and ${subcategoryCount} subcategories` : ''}`}
      >
        {/* Category Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-800">
          <Image
            src={imageSrc}
            alt={category.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              "object-cover transition-transform duration-300",
              "group-hover:scale-110"
            )}
            onError={() => setImageError(true)}
            priority={index < 6} // Prioritize first 6 images (Requirement 1.5)
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg=="
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
          
          {/* Listing count badge */}
          <div className="absolute top-3 right-3 px-3 py-1 bg-gray-900/80 backdrop-blur-sm rounded-full border border-gray-700">
            <span className="text-xs font-medium text-gray-200">
              {category.listing_count} {category.listing_count === 1 ? 'listing' : 'listings'}
            </span>
          </div>

          {/* Category Badges - Top Left */}
          {(badges.isPopular || badges.isRecentlyUpdated || badges.isNew || badges.subcategoryCount > 0) && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
              {/* New Badge */}
              {badges.isNew && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded-full border border-green-400/50" title="New category">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-semibold text-white">New</span>
                </span>
              )}
              
              {/* Recently Updated Badge */}
              {badges.isRecentlyUpdated && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/90 backdrop-blur-sm rounded-full border border-blue-400/50" title="Recently updated">
                  <Clock className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-semibold text-white">Updated</span>
                </span>
              )}
              
              {/* Popular Badge */}
              {badges.isPopular && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/90 backdrop-blur-sm rounded-full border border-orange-400/50" title="Popular category">
                  <Flame className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-semibold text-white">Popular</span>
                </span>
              )}
              
              {/* Subcategory Count Indicator */}
              {badges.subcategoryCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full border border-purple-400/50" title={`${badges.subcategoryCount} subcategories`}>
                  <ChevronRight className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-semibold text-white">{badges.subcategoryCount}</span>
                </span>
              )}
            </div>
          )}

          {/* Explore Category button overlay - desktop only */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:flex hidden">
            <span className="px-6 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-lg shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              Explore Category
            </span>
          </div>
        </div>

        {/* Category Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors duration-200">
            {category.name}
          </h3>
          
          {category.description && (
            <p className="mt-1 text-sm text-gray-400 line-clamp-2">
              {category.description}
            </p>
          )}
        </div>

        {/* Hover indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </Link>
    </motion.div>
  );
}
