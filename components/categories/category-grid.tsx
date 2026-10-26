"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Category } from "@/lib/types";

interface CategoryGridProps {
  categories: Category[];
  onCategorySelect?: (category: Category) => void;
  showBusinessCount?: boolean;
}

/**
 * CategoryGrid component displays all main categories in a responsive grid layout
 * Requirements: 3.1, 3.4
 * Features:
 * - Displays all 23 main categories with icons
 * - Shows business count for each category
 * - Neon-styled category cards with glassmorphism
 * - Hover animations with 3D tilt effect
 * - Clickable categories to navigate to subcategories
 * - Fully keyboard accessible with proper ARIA labels
 */
export function CategoryGrid({
  categories,
  onCategorySelect,
  showBusinessCount = true,
}: CategoryGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
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
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
    >
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          variants={itemVariants}
          onSelect={onCategorySelect}
          showBusinessCount={showBusinessCount}
        />
      ))}
    </motion.div>
  );
}

interface CategoryCardProps {
  category: Category;
  variants: any;
  onSelect?: (category: Category) => void;
  showBusinessCount?: boolean;
}

function CategoryCard({ category, variants, onSelect, showBusinessCount = true }: CategoryCardProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(category);
    }
  };

  const content = (
    <motion.div
      variants={variants}
      whileHover={{
        scale: 1.05,
        rotateY: 5,
        transition: { type: "spring", stiffness: 400 },
      }}
      whileTap={{ scale: 0.95 }}
      className="glass-card group relative overflow-hidden rounded-2xl p-6 cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      aria-label={`${category.name}${showBusinessCount && category.business_count !== undefined ? `, ${category.business_count} ${category.business_count === 1 ? 'business' : 'businesses'}` : ''}`}
    >
      {/* Neon glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-naija-green/20 via-transparent to-neon-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
        {/* Icon with neon effect */}
        <div className="text-5xl group-hover:scale-110 transition-transform duration-300 filter drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]">
          {category.icon}
        </div>

        {/* Category name */}
        <h3 className="text-sm font-semibold text-white text-center group-hover:text-neon-cyan transition-colors duration-300">
          {category.name}
        </h3>

        {/* Business count */}
        {showBusinessCount && category.business_count !== undefined && (
          <div className="text-xs text-gray-400 text-center">
            {category.business_count} {category.business_count === 1 ? 'business' : 'businesses'}
          </div>
        )}
      </div>

      {/* Border glow on hover */}
      <div className="absolute inset-0 rounded-2xl border border-neon-cyan/0 group-hover:border-neon-cyan/50 transition-all duration-300" />
    </motion.div>
  );

  // If onSelect is provided, render as button, otherwise as link
  if (onSelect) {
    return content;
  }

  return (
    <Link href={`/categories/${category.id}`} className="block">
      {content}
    </Link>
  );
}
