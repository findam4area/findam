"use client";

/**
 * SubcategoryCard Component
 * 
 * Displays an individual subcategory card with:
 * - Glassmorphism design with backdrop blur
 * - Framer Motion animations with staggered delays
 * - Hover effects (scale, gradient border, image brightness)
 * - Subcategory image, name, description (truncated), listing count
 * - Nested subcategory indicator
 * - Full accessibility support
 * 
 * Requirements: 16.7, 16.8, 16.16, 16.17, 16.18, 16.19, 16.20, 16.44, 16.32, 16.35, 16.36, 16.49, 16.50
 */

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Category } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import { getCategoryBadges } from "@/lib/utils/categories";

interface SubcategoryCardProps {
  subcategory: Category;
  index?: number;
  nestedSubcategoryCount?: number;
}

export function SubcategoryCard({ 
  subcategory, 
  index = 0, 
  nestedSubcategoryCount = 0 
}: SubcategoryCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Check if user prefers reduced motion
  const prefersReducedMotion = useReducedMotion();

  // Calculate badges based on subcategory data
  const badges = useMemo(
    () => getCategoryBadges(subcategory, nestedSubcategoryCount),
    [subcategory, nestedSubcategoryCount]
  );

  // Animation variants - respect prefers-reduced-motion
  const animationVariants = {
    initial: prefersReducedMotion 
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  // Transition config - faster when reduced motion is preferred
  // Use index * 80ms for staggered delays as per requirement 16.17
  const animationTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.4, delay: index * 0.08 };

  // Placeholder image for subcategories without images or when image fails to load
  const placeholderImage = `https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=300&fit=crop`;

  // Validate and sanitize image URL
  const getValidImageUrl = () => {
    if (imageError || !subcategory.image_url) {
      return placeholderImage;
    }

    if (typeof subcategory.image_url === 'string') {
      if (subcategory.image_url.startsWith('/')) {
        return subcategory.image_url;
      }
      if (subcategory.image_url.startsWith('http://') || subcategory.image_url.startsWith('https://')) {
        return subcategory.image_url;
      }
    }

    console.warn(`Invalid image_url for subcategory "${subcategory.name}": "${subcategory.image_url}"`);
    return placeholderImage;
  };

  const imageSrc = getValidImageUrl();

  // Truncate description to 2 lines as per requirement 16.19
  const truncatedDescription = subcategory.description 
    ? subcategory.description.length > 100 
      ? `${subcategory.description.slice(0, 100)}...`
      : subcategory.description
    : null;

  // Build accessible label as per requirement 16.32
  const ariaLabel = `Browse ${subcategory.name} category - ${subcategory.listing_count} ${subcategory.listing_count === 1 ? 'listing' : 'listings'}${nestedSubcategoryCount > 0 ? ` - ${nestedSubcategoryCount} ${nestedSubcategoryCount === 1 ? 'subcategory' : 'subcategories'}` : ''}`;

  return (
    <motion.div
      initial={animationVariants.initial}
      animate={animationVariants.animate}
      transition={animationTransition}
      className="group relative"
    >
      {/* Glassmorphism effect with gradient border on hover */}
      {/* Requirement 16.7: Glassmorphism design (backdrop-blur, semi-transparent bg, border) */}
      <div 
        className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
        aria-hidden="true"
      />
      
      <Link
        href={`/categories/${subcategory.slug}`}
        className={cn(
          "block relative overflow-hidden rounded-xl",
          // Glassmorphism: semi-transparent bg, backdrop blur, border
          "bg-gray-900/40 backdrop-blur-md border border-gray-700/50 hover:border-primary-500/50",
          "transition-all duration-300",
          // Requirement 16.35: Visible focus ring with 3px offset and primary-500 color
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950",
          // Requirement 16.18: 3% scale on hover
          "hover:shadow-xl hover:shadow-primary-500/10 hover:scale-[1.03]",
          // Requirement 16.49: Minimum 44x44px touch targets on mobile
          "min-h-touch min-w-touch",
          // Requirement 16.50: Tap animation on mobile (scale down to 0.97)
          !prefersReducedMotion && "active:scale-[0.97] active:ring-2 active:ring-primary-500"
        )}
        tabIndex={0}
        aria-label={ariaLabel}
      >
        {/* Subcategory Image with fixed aspect ratio 4/3 - Requirement 16.20 */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-800">
          <Image
            src={imageSrc}
            alt={subcategory.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-300",
              // Requirement 16.18: Image brightness change on hover
              "group-hover:scale-110 group-hover:brightness-110"
            )}
            onError={() => setImageError(true)}
            priority={index < 4}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg=="
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
          
          {/* Listing count badge */}
          <div className="absolute top-3 right-3 px-3 py-1 bg-gray-900/80 backdrop-blur-sm rounded-full border border-gray-700">
            <span className="text-xs font-medium text-gray-200">
              {subcategory.listing_count} {subcategory.listing_count === 1 ? 'listing' : 'listings'}
            </span>
          </div>

          {/* Nested subcategory indicator - Requirement 16.8 */}
          {nestedSubcategoryCount > 0 && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full border border-purple-400/50">
              <ChevronRight className="w-3 h-3 text-white" />
              <span className="text-[10px] font-semibold text-white">
                {nestedSubcategoryCount}
              </span>
            </div>
          )}
        </div>

        {/* Subcategory Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors duration-200">
            {subcategory.name}
          </h3>
          
          {/* Description truncated to 2 lines - Requirement 16.19 */}
          {truncatedDescription && (
            <p className="mt-1 text-sm text-gray-400 line-clamp-2">
              {truncatedDescription}
            </p>
          )}
        </div>

        {/* Hover indicator bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </Link>
    </motion.div>
  );
}