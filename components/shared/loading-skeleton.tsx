"use client";

/**
 * LoadingSkeleton Component
 * 
 * Displays shimmer loading placeholders during data fetch operations.
 * Supports configurable count and layouts (grid/list) with smooth animations.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 16.23, 16.24
 */

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  count?: number; // Number of skeleton cards (default: 8)
  layout?: 'grid' | 'list'; // Layout type (default: 'grid')
  className?: string; // Additional classes for wrapper
}

export function LoadingSkeleton({ 
  count = 8, 
  layout = 'grid',
  className 
}: LoadingSkeletonProps) {
  // Inject shimmer animation styles on mount
  useEffect(() => {
    const styleId = 'loading-skeleton-shimmer-styles';
    
    // Only inject styles once
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes shimmer-animation {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 50%,
            transparent 100%
          );
          animation: shimmer-animation 2s infinite;
        }

        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .shimmer-effect {
            animation: none;
            background: rgba(255, 255, 255, 0.03);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div
      className={cn(
        // Grid layout: 1 column mobile, 2 tablet, 3 desktop, 4 large screens
        layout === 'grid' && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        // List layout: single column with spacing
        layout === 'list' && "flex flex-col gap-4",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading categories"
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} layout={layout} />
      ))}
    </div>
  );
}

function SkeletonCard({ layout }: { layout: 'grid' | 'list' }) {
  if (layout === 'list') {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800">
        <div className="flex gap-4 p-4">
          {/* List image skeleton */}
          <div className="relative w-32 h-24 flex-shrink-0 rounded-lg bg-gray-800 overflow-hidden">
            <div className="shimmer-effect absolute inset-0" />
          </div>

          {/* List content skeleton */}
          <div className="flex-1 space-y-3">
            {/* Title */}
            <div className="h-5 bg-gray-800 rounded w-3/4 overflow-hidden relative">
              <div className="shimmer-effect absolute inset-0" />
            </div>
            {/* Description */}
            <div className="h-4 bg-gray-800 rounded w-full overflow-hidden relative">
              <div className="shimmer-effect absolute inset-0" />
            </div>
            <div className="h-4 bg-gray-800 rounded w-2/3 overflow-hidden relative">
              <div className="shimmer-effect absolute inset-0" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div className="relative overflow-hidden rounded-xl bg-gray-900/50 border border-gray-800">
      {/* Image skeleton */}
      <div className="relative aspect-[4/3] bg-gray-800 overflow-hidden">
        <div className="shimmer-effect absolute inset-0" />
        
        {/* Badge skeleton - positioned like listing count badge */}
        <div className="absolute top-3 right-3 w-20 h-6 bg-gray-700/80 backdrop-blur-sm rounded-full overflow-hidden">
          <div className="shimmer-effect absolute inset-0" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-800 rounded w-3/4 overflow-hidden relative">
          <div className="shimmer-effect absolute inset-0" />
        </div>
        
        {/* Description skeleton - 2 lines */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-800 rounded w-full overflow-hidden relative">
            <div className="shimmer-effect absolute inset-0" />
          </div>
          <div className="h-4 bg-gray-800 rounded w-5/6 overflow-hidden relative">
            <div className="shimmer-effect absolute inset-0" />
          </div>
        </div>
      </div>

      {/* Bottom gradient indicator skeleton */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 overflow-hidden">
        <div className="shimmer-effect absolute inset-0" />
      </div>
    </div>
  );
}
