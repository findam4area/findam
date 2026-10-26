"use client";

/**
 * CategoryStats Component
 * 
 * Displays category statistics including:
 * - Total categories count
 * - Total listings count
 * - Trending categories (top 3 by listing count)
 * 
 * Requirements: 4.1, 4.4
 */

import { useMemo } from "react";
import { FolderOpen, Package, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types/core";

interface CategoryStatsProps {
  categories: Category[];
  className?: string;
}

export function CategoryStats({ categories, className }: CategoryStatsProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const totalCategories = categories.length;
    const totalListings = categories.reduce(
      (sum, cat) => sum + (cat.listing_count || 0),
      0
    );
    
    // Get top 3 trending categories by listing count
    const trendingCategories = [...categories]
      .filter(cat => cat.listing_count && cat.listing_count > 0)
      .sort((a, b) => (b.listing_count || 0) - (a.listing_count || 0))
      .slice(0, 3);

    return {
      totalCategories,
      totalListings,
      trendingCategories,
    };
  }, [categories]);

  return (
    <div className={cn("w-full", className)}>
      {/* Stats Cards Grid - 1 column mobile, 2 tablet, 3 desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Total Categories Card */}
        <div className="relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-primary-500/20">
                <FolderOpen className="w-5 h-5 text-primary-400" />
              </div>
              <span className="text-sm font-medium text-gray-400">Total Categories</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.totalCategories.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Listings Card */}
        <div className="relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-purple-500/20">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm font-medium text-gray-400">Total Listings</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.totalListings.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Trending Card */}
        <div className="relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800 p-6 sm:col-span-2 lg:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-orange-500/20">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-sm font-medium text-gray-400">Trending Now</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.trendingCategories.length} Top Categories
            </p>
          </div>
        </div>
      </div>

      {/* Trending Section - Top 3 categories by listing count */}
      {stats.trendingCategories.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            Trending Categories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.trendingCategories.map((category, index) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className={cn(
                  "group relative overflow-hidden rounded-xl",
                  "bg-gray-900/30 border border-gray-800",
                  "p-4 hover:border-orange-500/50 hover:bg-gray-800/50",
                  "transition-all duration-300"
                )}
              >
                {/* Rank badge */}
                <div className={cn(
                  "absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center",
                  index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                  index === 1 ? "bg-gray-400/20 text-gray-300" :
                  "bg-orange-700/20 text-orange-300"
                )}>
                  <span className="text-sm font-bold">#{index + 1}</span>
                </div>

                <div className="pr-8">
                  <h4 className="text-base font-semibold text-white group-hover:text-orange-400 transition-colors duration-200">
                    {category.name}
                  </h4>
                  <p className="text-sm text-gray-400 mt-1">
                    {category.listing_count?.toLocaleString() || 0} listings
                  </p>
                </div>

                {/* Hover indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
