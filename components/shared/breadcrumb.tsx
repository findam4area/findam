"use client";

/**
 * Breadcrumb Component
 * 
 * A reusable breadcrumb navigation component that:
 * - Provides hierarchical navigation trail
 * - Uses semantic HTML for accessibility
 * - Includes schema.org structured data for SEO
 * - Displays current page indicator
 * - Features responsive design with glass morphism effects
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 16.37, 16.38
 * 
 * @example
 * // Basic usage
 * <Breadcrumb items={[
 *   { label: 'Home', href: '/' },
 *   { label: 'Electronics', href: '/categories/electronics' },
 *   { label: 'Laptops', href: '/categories/laptops' }
 * ]} />
 */

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  // Generate schema.org BreadcrumbList structured data for SEO
  // Requirements: 7.5, 16.38
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://findam.ng'}${item.href}`
    }))
  };

  return (
    <>
      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Semantic breadcrumb navigation - Requirements: 7.4, 16.37 */}
      <nav
        aria-label="breadcrumb"
        className={cn(
          "flex items-center py-3 px-4 rounded-lg",
          "bg-dark-card/50 backdrop-blur-sm border border-dark-border",
          "overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent",
          className
        )}
      >
        <ol className="flex items-center space-x-2 min-w-max">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isFirst = index === 0;

            return (
              <li key={index} className="flex items-center">
                {/* Separator (chevron) - not shown before first item */}
                {!isFirst && (
                  <ChevronRight
                    className="w-4 h-4 mx-2 text-gray-500 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}

                {/* Breadcrumb item */}
                {isLast ? (
                  // Current page - not a link, with aria-current - Requirement 7.4
                  <span
                    aria-current="page"
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md",
                      "text-sm font-medium text-white",
                      "bg-primary-500/10 border border-primary-500/20"
                    )}
                  >
                    {isFirst && <Home className="w-4 h-4" aria-hidden="true" />}
                    {item.label}
                  </span>
                ) : (
                  // Link to previous pages
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md",
                      "text-sm font-medium text-gray-400",
                      "hover:text-white hover:bg-gray-800/50",
                      "transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2",
                      "focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                      "focus-visible:ring-offset-dark-bg"
                    )}
                  >
                    {isFirst && <Home className="w-4 h-4" aria-hidden="true" />}
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/**
 * Compact variant for mobile or space-constrained layouts
 * Shows only last 2 items with ellipsis for longer paths
 */
export function BreadcrumbCompact({ items, className }: BreadcrumbProps) {
  // Show only first and last items if path is longer than 3 items
  const displayItems =
    items.length > 3
      ? [
          items[0],
          { label: "...", href: items[items.length - 2].href },
          items[items.length - 1]
        ]
      : items;

  return <Breadcrumb items={displayItems} className={className} />;
}
