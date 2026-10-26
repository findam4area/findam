"use client";

/**
 * CategoryPreviewPopover Component
 * 
 * A hover-triggered popover that shows a quick preview of a category's
 * subcategories and top listings. Desktop only (>= 1024px).
 * 
 * Features:
 * - 500ms hover delay before showing popover
 * - 200ms mouse leave delay before closing
 * - Fetches subcategories (up to 5) and top 3 listings on hover
 * - Uses floating-ui for positioning
 * - Keyboard accessible with Escape to close
 * - Proper ARIA attributes for screen readers
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.7
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  useFloating,
  flip,
  shift,
  offset,
  FloatingPortal,
} from "@floating-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Layers, Package } from "lucide-react";
import type { Category } from "@/lib/types/core";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  listing_count: number;
}

interface ListingPreview {
  id: string;
  title: string;
  thumbnail_url: string | null;
  price: number;
  location?: string;
}

interface CategoryPreviewPopoverProps {
  /** The category to preview */
  category: Category;
  /** The trigger element (typically a CategoryCard) */
  children: React.ReactNode;
}

// ============================================================================
// Mock Data Generators (for demo purposes - replace with real API calls)
// ============================================================================

/**
 * Generate mock subcategories for demo purposes
 * In production, replace with actual API call to Supabase
 */
function generateMockSubcategories(categoryId: string): Subcategory[] {
  // Generate deterministic mock data based on category id
  const seed = categoryId.charCodeAt(0) + categoryId.charCodeAt(categoryId.length - 1);
  const subcategoryNames = [
    "Electronics & Gadgets",
    "Home & Garden",
    "Fashion & Accessories",
    "Sports & Outdoors",
    "Health & Beauty",
    "Automotive",
    "Books & Media",
    "Toys & Games",
    "Food & Beverages",
    "Office Supplies",
  ];

  // Return 2-5 subcategories based on category name hash
  const count = Math.min(5, Math.max(2, (seed % 4) + 2));
  return Array.from({ length: count }, (_, i) => ({
    id: `${categoryId}-sub-${i}`,
    name: subcategoryNames[(seed + i) % subcategoryNames.length],
    slug: subcategoryNames[(seed + i) % subcategoryNames.length].toLowerCase().replace(/\s+/g, "-"),
    listing_count: Math.floor((seed * (i + 1) * 17) % 150) + 5,
  }));
}

/**
 * Generate mock listings for demo purposes
 * In production, replace with actual API call to Supabase
 */
function generateMockListings(categoryId: string): ListingPreview[] {
  // Generate deterministic mock data based on category id
  const seed = categoryId.charCodeAt(0) + categoryId.length;
  const listingTitles = [
    "Professional Service Package",
    "Premium Quality Product",
    "Certified Vendor Item",
    "Top Rated Solution",
    "Exclusive Deal",
    "New Arrival",
    "Best Seller",
    "Limited Edition",
  ];

  const locations = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano"];
  const thumbnailOptions = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&h=200&fit=crop",
  ];

  // Return 3 listings
  return Array.from({ length: 3 }, (_, i) => ({
    id: `${categoryId}-listing-${i}`,
    title: `${listingTitles[(seed + i) % listingTitles.length]} ${i + 1}`,
    thumbnail_url: thumbnailOptions[(seed + i) % thumbnailOptions.length],
    price: Math.floor((seed * (i + 1) * 1000) % 50000) + 5000,
    location: locations[(seed + i) % locations.length],
  }));
}

// ============================================================================
// Component
// ============================================================================

export function CategoryPreviewPopover({
  category,
  children,
}: CategoryPreviewPopoverProps) {
  // State for popover visibility
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    subcategories: Subcategory[];
    listings: ListingPreview[];
  } | null>(null);

  // Refs for hover timing
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Configure floating-ui positioning
  const { refs, floatingStyles, placement } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) {
        setIsOpen(false);
      }
    },
    middleware: [
      flip({
        fallbackPlacements: ["bottom", "top", "left", "right"],
        padding: 10,
      }),
      shift({
        padding: 10,
      }),
      offset({
        mainAxis: 12,
        crossAxis: 0,
      }),
    ],
    whileElementsMounted: (reference, floating, update) => {
      // Optional: use a library like floating-ui-mutation-safe for proper cleanup
      // For now, we just call update
      const timeoutId = setTimeout(() => update(), 100);
      return () => clearTimeout(timeoutId);
    },
  });

  // Fetch preview data on hover
  const fetchPreviewData = useCallback(async () => {
    if (previewData) return; // Already fetched

    setIsLoading(true);

    try {
      // Simulate API delay (remove in production)
      await new Promise((resolve) => setTimeout(resolve, 200));

      // In production, replace with actual API calls:
      // const supabase = createClient();
      // const { data: subcategories } = await supabase
      //   .from('categories')
      //   .select('id, name, slug, listing_count')
      //   .eq('parent_id', category.id)
      //   .limit(5);
      // const { data: listings } = await supabase
      //   .from('listings')
      //   .select('id, title, thumbnail_url, price, location')
      //   .eq('category_id', category.id)
      //   .eq('status', 'approved')
      //   .order('created_at', { ascending: false })
      //   .limit(3);

      // Use mock data for demo
      const subcategories = generateMockSubcategories(category.id);
      const listings = generateMockListings(category.id);

      setPreviewData({ subcategories, listings });
    } catch (error) {
      console.error("Failed to fetch preview data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [category.id, previewData]);

  // Handle mouse enter on trigger
  const handleMouseEnter = () => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    // Set timeout to show popover after 500ms
    showTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
      fetchPreviewData();
    }, 500);
  };

  // Handle mouse leave on trigger
  const handleMouseLeave = () => {
    // Clear any pending show timeout
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    // Set timeout to hide popover after 200ms
    hideTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Handle focus events for keyboard accessibility
  const handleFocus = () => {
    if (!isOpen) {
      fetchPreviewData();
    }
    setIsOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Check if focus moved outside the popover
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !triggerRef.current?.contains(relatedTarget)) {
      setIsOpen(false);
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        // Return focus to trigger element
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Determine arrow position based on placement
  const getArrowPosition = () => {
    const [side] = placement.split("-");
    switch (side) {
      case "top":
        return "bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-8 border-x-8 border-b-0 border-transparent border-t-gray-800";
      case "bottom":
        return "top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-8 border-x-8 border-t-0 border-transparent border-b-gray-800";
      case "left":
        return "right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-8 border-y-8 border-r-0 border-transparent border-l-gray-800";
      case "right":
        return "left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-8 border-y-8 border-l-0 border-transparent border-r-gray-800";
      default:
        return "bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-8 border-x-8 border-b-0 border-transparent border-t-gray-800";
    }
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Trigger Element */}
      {children}

      {/* Popover Portal */}
      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="hidden lg:block z-50 max-w-md w-[360px]"
              role="dialog"
              aria-label={`Preview for ${category.name}`}
              aria-modal="false"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15 }}
                className="relative bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Arrow */}
                <div
                  className={cn(
                    "absolute w-0 h-0 border-solid",
                    getArrowPosition()
                  )}
                  aria-hidden="true"
                />

                {/* Popover Header */}
                <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm">
                  <h4 className="text-white font-semibold text-sm">
                    {category.name}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {category.listing_count} {category.listing_count === 1 ? "listing" : "listings"} available
                  </p>
                </div>

                {/* Loading State */}
                {isLoading && (
                  <div className="p-4 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-primary-500 rounded-full animate-spin" />
                      <span className="text-sm">Loading preview...</span>
                    </div>
                  </div>
                )}

                {/* Content */}
                {!isLoading && previewData && (
                  <div className="p-4 space-y-4">
                    {/* Subcategories Section */}
                    {previewData.subcategories.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Layers className="w-4 h-4 text-primary-400" />
                          <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                            Subcategories
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {previewData.subcategories.slice(0, 5).map((sub) => (
                            <li key={sub.id}>
                              <Link
                                href={`/categories/${sub.slug}`}
                                className="flex items-center justify-between px-2 py-1.5 rounded-md text-sm text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors group"
                              >
                                <span className="truncate">{sub.name}</span>
                                <span className="text-xs text-gray-500 group-hover:text-gray-400">
                                  {sub.listing_count}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Top Listings Section */}
                    {previewData.listings.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-primary-400" />
                          <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                            Top Listings
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {previewData.listings.map((listing) => (
                            <li key={listing.id}>
                              <Link
                                href={`/listings/${listing.id}`}
                                className="flex items-center gap-3 p-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/60 transition-colors group"
                              >
                                {/* Thumbnail */}
                                <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-700">
                                  {listing.thumbnail_url ? (
                                    <Image
                                      src={listing.thumbnail_url}
                                      alt={listing.title}
                                      fill
                                      sizes="48px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-5 h-5 text-gray-500" />
                                    </div>
                                  )}
                                </div>

                                {/* Title and Price */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-200 truncate group-hover:text-white">
                                    {listing.title}
                                  </p>
                                  <p className="text-xs text-primary-400 font-medium">
                                    ₦{listing.price.toLocaleString()}
                                  </p>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* View All Link */}
                    <div className="pt-2 border-t border-gray-700/50">
                      <Link
                        href={`/categories/${category.slug}`}
                        className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-primary-500 hover:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        View All {category.name}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </div>
  );
}