"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Category } from "@/lib/types";
import { ChevronRight } from "lucide-react";

interface SubcategoryListProps {
  mainCategory: Category;
  subcategories: Category[];
  onSubcategoryClick?: (subcategory: Category) => void;
}

/**
 * SubcategoryList component displays subcategories for a selected main category
 * Requirements: 3.2, 3.4, 3.6
 * Features:
 * - Display subcategories for selected main category
 * - Show subcategory name and business count
 * - Navigate to business list when subcategory clicked
 * - Support keyboard navigation
 */
export function SubcategoryList({
  mainCategory,
  subcategories,
  onSubcategoryClick,
}: SubcategoryListProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">{mainCategory.icon}</div>
        <div>
          <h2 className="text-2xl font-bold text-white">{mainCategory.name}</h2>
          <p className="text-sm text-gray-400">
            {subcategories.length} subcategories
          </p>
        </div>
      </div>

      {/* Subcategory List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {subcategories.map((subcategory) => (
          <SubcategoryCard
            key={subcategory.id}
            subcategory={subcategory}
            mainCategory={mainCategory}
            variants={itemVariants}
            onClick={onSubcategoryClick}
          />
        ))}
      </motion.div>

      {/* Empty state */}
      {subcategories.length === 0 && (
        <div className="text-center py-12 glass-card rounded-2xl">
          <p className="text-gray-400">No subcategories available</p>
        </div>
      )}
    </div>
  );
}

interface SubcategoryCardProps {
  subcategory: Category;
  mainCategory: Category;
  variants: any;
  onClick?: (subcategory: Category) => void;
}

function SubcategoryCard({
  subcategory,
  mainCategory,
  variants,
  onClick,
}: SubcategoryCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(subcategory);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const content = (
    <motion.div
      variants={variants}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card group relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-200"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${subcategory.name}${subcategory.business_count !== undefined ? `, ${subcategory.business_count} businesses` : ""}`}
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white group-hover:text-neon-cyan transition-colors duration-200">
            {subcategory.name}
          </h3>
          {subcategory.business_count !== undefined && (
            <p className="text-sm text-gray-400 mt-1">
              {subcategory.business_count}{" "}
              {subcategory.business_count === 1 ? "business" : "businesses"}
            </p>
          )}
        </div>

        {/* Arrow icon */}
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all duration-200" />
      </div>

      {/* Border effect */}
      <div className="absolute inset-0 rounded-xl border border-white/5 group-hover:border-neon-cyan/30 transition-all duration-200" />
    </motion.div>
  );

  // If onClick is provided, render as button, otherwise as link
  if (onClick) {
    return content;
  }

  return (
    <Link
      href={`/categories/${mainCategory.id}/businesses?subcategory_id=${subcategory.id}`}
      className="block"
    >
      {content}
    </Link>
  );
}

