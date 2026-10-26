"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { KeyboardNavigableList } from "@/components/accessibility";
import { 
  ChevronRight, 
  ChevronLeft,
  TrendingUp, 
  Sparkles,
  Smartphone,
  Shirt,
  UtensilsCrossed,
  Home,
  Car,
  Wrench,
  Briefcase,
  BookOpen,
  Dumbbell,
  Sparkle,
  type LucideIcon
} from "lucide-react";
import type { CategoryShowcaseProps, Category } from "./types";
import { getSafeImageUrl } from "@/lib/utils/image-url";

/**
 * CategoryShowcase Component
 * 
 * Interactive grid of product categories with real images and enhanced features.
 * 
 * Requirements:
 * - 2.1: Display minimum 6 categories in responsive grid
 * - 2.2: Apply elevation and scale effects on hover within 200ms
 * - 2.3: Display item counts from Supabase
 * - 2.4: Highlight active category with ring indicator
 * - 2.5: Auto-rotate active category every 3 seconds
 * - 2.6: Navigate to category page on click
 * - 2.7: Display solid accent colors (no gradients)
 * - 2.8: Responsive grid (2 cols mobile, 6 cols desktop)
 * - 2.9: Support keyboard navigation
 * 
 * Enhanced Features:
 * - Real category images
 * - Trending badge for popular categories
 * - Smooth image loading with blur effect
 * - Compact, modern design
 */

// Real category images from Unsplash
const CATEGORY_IMAGES: Record<string, string> = {
  electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
  fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
  "real-estate": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop",
  properties: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop",
  vehicles: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop",
  services: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop",
  home: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=300&fit=crop",
  jobs: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=300&fit=crop",
  books: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop",
  sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop",
  beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop",
};

// Category icons mapping
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  electronics: Smartphone,
  fashion: Shirt,
  food: UtensilsCrossed,
  "real-estate": Home,
  properties: Home,
  vehicles: Car,
  services: Wrench,
  home: Home,
  jobs: Briefcase,
  books: BookOpen,
  sports: Dumbbell,
  beauty: Sparkle,
};

async function fetchCategories(): Promise<Category[]> {
  const response = await fetch("/api/categories/homepage");
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
}

function CategoryCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gray-800/50 animate-pulse">
      <div className="aspect-[4/3] bg-gray-700/50" />
      <div className="p-4">
        <div className="h-5 bg-gray-700/50 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-700/50 rounded w-1/2" />
      </div>
    </div>
  );
}

export function CategoryShowcase({ categories: initialCategories, className = "" }: CategoryShowcaseProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch categories with TanStack Query
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", "homepage"],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: initialCategories,
  });

  // Memoize displayCategories to fix useEffect dependency warning
  const displayCategories = useMemo(
    () => categories ?? initialCategories ?? [],
    [categories, initialCategories]
  );

  // Auto-rotation logic (Requirement 2.5)
  useEffect(() => {
    if (!isAutoRotating || displayCategories.length === 0) return;

    const interval = setInterval(() => {
      setActiveCategory((prev) => {
        const currentIndex = prev ? displayCategories.findIndex((c) => c.id === prev) : -1;
        const nextIndex = (currentIndex + 1) % displayCategories.length;
        return displayCategories[nextIndex].id;
      });
    }, 3000); // Rotate every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoRotating, displayCategories]);

  const handleCategoryHover = (categoryId: string) => {
    setActiveCategory(categoryId);
    setIsAutoRotating(false); // Pause on hover (Requirement 2.5)
  };

  const handleCategoryLeave = () => {
    setIsAutoRotating(true); // Resume on mouse leave
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  // Determine trending categories (top 3 by item count)
  const sortedByCount = [...displayCategories].sort((a, b) => b.itemCount - a.itemCount);
  const trendingIds = new Set(sortedByCount.slice(0, 3).map(c => c.id));

  // Check scroll position
  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  // Initialize scroll check
  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [displayCategories, checkScroll]);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -400,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 400,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className={`py-16 ${className}`} aria-labelledby="categories-heading" role="region">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full bg-naija-green/10 border border-naija-green/20" role="status" aria-label="Featured section">
              <Sparkles className="w-4 h-4 text-naija-green" aria-hidden="true" role="img" aria-label="Sparkles decorative icon" />
              <span className="text-sm font-medium text-naija-green">Explore Categories</span>
            </div>
            {/* Proper heading hierarchy - h2 follows h1 - Requirements: 15.7 */}
            <h2 id="categories-heading" className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Browse by Category
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Discover thousands of products across various categories
            </p>
          </motion.div>
        </div>

        {/* Loading State */}
        {isLoading && !initialCategories && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <CategoryCardSkeleton key={index} />
            ))}
          </div>
        )}

        {/* Category Grid - Compact & Responsive (Requirement 2.8) */}
        {!isLoading && displayCategories.length > 0 && (
          <div className="relative group">
            {/* Left Scroll Button */}
            <AnimatePresence>
              {canScrollLeft && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-gray-900/90 border border-gray-700 flex items-center justify-center hover:bg-gray-800 hover:border-naija-green transition-all shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100"
                  aria-label="Scroll categories left"
                  type="button"
                >
                  <ChevronLeft className="w-6 h-6 text-white" aria-hidden="true" role="img" aria-label="Left arrow icon" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Right Scroll Button */}
            <AnimatePresence>
              {canScrollRight && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={scrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-gray-900/90 border border-gray-700 flex items-center justify-center hover:bg-gray-800 hover:border-naija-green transition-all shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100"
                  aria-label="Scroll categories right"
                  type="button"
                >
                  <ChevronRight className="w-6 h-6 text-white" aria-hidden="true" role="img" aria-label="Right arrow icon" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth pb-4"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <div className="flex gap-4 min-w-max px-1">
                {displayCategories.map((category, index) => {
                  const isActive = activeCategory === category.id;
                  const isTrending = trendingIds.has(category.id);
                  
                  // Use database image_url if available, otherwise fall back to hardcoded images
                  let categoryImage: string;
                  if (category.image_url && typeof category.image_url === 'string' && 
                      (category.image_url.startsWith('/') || category.image_url.startsWith('http'))) {
                    categoryImage = category.image_url;
                  } else {
                    const rawCategoryImage = CATEGORY_IMAGES[category.slug] || CATEGORY_IMAGES[category.name.toLowerCase()] || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop";
                    categoryImage = getSafeImageUrl(rawCategoryImage, "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop", category.name);
                  }
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="w-[280px] flex-shrink-0"
                    >
                      <Link
                        href={`/categories/${category.slug}`}
                        onMouseEnter={() => handleCategoryHover(category.id)}
                        onMouseLeave={handleCategoryLeave}
                        onClick={() => handleCategoryClick(category.id)}
                        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-xl group h-full"
                        aria-label={`Browse ${category.name} - ${category.itemCount} items`}
                        aria-current={isActive ? "true" : undefined}
                        tabIndex={0}
                      >
                        <motion.div
                          className={`
                            relative overflow-hidden rounded-xl bg-gray-800/50 backdrop-blur-sm h-full
                            border transition-all duration-200
                            ${isActive 
                              ? "border-naija-green shadow-lg shadow-naija-green/20" 
                              : "border-gray-700/50 hover:border-gray-600"
                            }
                          `}
                          // Hover effects: elevation and scale (Requirement 2.2)
                          whileHover={{
                            scale: 1.03,
                            y: -4,
                            transition: { duration: 0.2 },
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Category Image */}
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <Image
                              src={categoryImage}
                              alt={category.name}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-110"
                              sizes="280px"
                              priority={index < 6}
                            />
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                            
                            {/* Trending Badge */}
                            <AnimatePresence>
                              {isTrending && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-neon-orange-dark text-white text-xs font-semibold"
                                  role="status"
                                  aria-label="Trending category"
                                >
                                  <TrendingUp className="w-3 h-3" aria-hidden="true" role="img" aria-label="Trending icon" />
                                  <span>Hot</span>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Icon Badge */}
                            <div 
                              className="absolute top-2 left-2 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 bg-white/10"
                              aria-hidden="true"
                            >
                              {(() => {
                                const IconComponent = CATEGORY_ICONS[category.slug] || CATEGORY_ICONS[category.name.toLowerCase()] || Sparkle;
                                return <IconComponent className="w-5 h-5 text-white" role="img" aria-label={`${category.name} category icon`} />;
                              })()}
                            </div>
                          </div>

                          {/* Category Info */}
                          <div className="p-3">
                            {/* Proper heading hierarchy - h3 under h2 - Requirements: 15.7 */}
                            <h3 className="font-semibold text-white mb-1 text-sm group-hover:text-naija-green transition-colors">
                              {category.name}
                            </h3>
                            
                            {/* Item Count (Requirement 2.3) */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-400">
                                {category.itemCount.toLocaleString()} items
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-naija-green group-hover:translate-x-1 transition-all" aria-hidden="true" role="img" aria-label="Right arrow icon" />
                            </div>
                          </div>

                          {/* Active indicator (Requirement 2.4) */}
                          <AnimatePresence>
                            {isActive && (
                              <motion.div
                                className="absolute inset-0 rounded-xl border-2 border-naija-green pointer-events-none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                aria-hidden="true"
                              />
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* View All Categories Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-800/50 border border-gray-700 hover:border-naija-green hover:bg-gray-800 transition-all group"
          >
            <span className="text-sm font-medium">View All Categories</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

