"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { Category, Subcategory } from "@/lib/types";

interface CategoryBreadcrumbsProps {
  category?: Category;
  subcategory?: Subcategory;
  showHome?: boolean;
  className?: string;
}

/**
 * CategoryBreadcrumbs component displays navigation breadcrumbs for category hierarchy
 * Features:
 * - Shows Home > Category > Subcategory path
 * - Clickable links for navigation
 * - Neon-styled separators
 * - Responsive design
 */
export function CategoryBreadcrumbs({
  category,
  subcategory,
  showHome = true,
  className = "",
}: CategoryBreadcrumbsProps) {
  const breadcrumbs = [];

  if (showHome) {
    breadcrumbs.push({
      label: "Home",
      href: "/",
      icon: <Home className="w-4 h-4" />,
    });
  }

  if (category) {
    breadcrumbs.push({
      label: category.name,
      href: `/search?category_id=${category.id}`,
      icon: <span className="text-lg">{category.icon}</span>,
    });
  }

  if (subcategory) {
    breadcrumbs.push({
      label: subcategory.name,
      href: `/search?category_id=${category?.id}&subcategory_id=${subcategory.id}`,
      icon: null,
    });
  }

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      className={`flex items-center space-x-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center space-x-2">
            {/* Separator */}
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-500" />}

            {/* Breadcrumb item */}
            {index === breadcrumbs.length - 1 ? (
              // Last item - not clickable
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-1.5 text-neon-cyan font-medium"
              >
                {crumb.icon && <span>{crumb.icon}</span>}
                <span>{crumb.label}</span>
              </motion.span>
            ) : (
              // Clickable items
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={crumb.href}
                  className="flex items-center space-x-1.5 text-gray-400 hover:text-white transition-colors duration-200 group"
                >
                  {crumb.icon && (
                    <span className="group-hover:scale-110 transition-transform duration-200">
                      {crumb.icon}
                    </span>
                  )}
                  <span className="group-hover:underline">{crumb.label}</span>
                </Link>
              </motion.div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Compact version for mobile displays
 */
export function CategoryBreadcrumbsCompact({
  category,
  subcategory,
  className = "",
}: CategoryBreadcrumbsProps) {
  if (!category && !subcategory) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {category && (
        <>
          <span className="text-xl">{category.icon}</span>
          <span className="text-gray-400">{category.name}</span>
        </>
      )}

      {subcategory && (
        <>
          <ChevronRight className="w-4 h-4 text-gray-500" />
          <span className="text-neon-cyan font-medium">{subcategory.name}</span>
        </>
      )}
    </div>
  );
}
