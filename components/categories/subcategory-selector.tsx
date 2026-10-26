"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Category, Subcategory } from "@/lib/types";

interface SubcategorySelectorProps {
  categoryId: string;
  selectedSubcategoryId?: string;
  onSubcategorySelect: (subcategory: Subcategory) => void;
  className?: string;
}

/**
 * SubcategorySelector component displays subcategories for a selected category
 * Features:
 * - Fetches subcategories based on parent category
 * - Animated selection with neon highlights
 * - Validates subcategory belongs to parent category
 */
export function SubcategorySelector({
  categoryId,
  selectedSubcategoryId,
  onSubcategorySelect,
  className = "",
}: SubcategorySelectorProps) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubcategories() {
      if (!categoryId) {
        setSubcategories([]);
        setCategory(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/categories/${categoryId}/subcategories`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch subcategories");
        }

        const data = await response.json();
        setCategory(data.category);
        setSubcategories(data.subcategories || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load subcategories",
        );
        setSubcategories([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSubcategories();
  }, [categoryId]);

  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="h-6 w-32 bg-dark-card animate-pulse rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-10 bg-dark-card animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-400 text-sm ${className}`}>
        <p>{error}</p>
      </div>
    );
  }

  if (subcategories.length === 0) {
    return (
      <div className={`text-gray-400 text-sm ${className}`}>
        <p>No subcategories available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Category label */}
      {category && (
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{category.icon}</span>
          <h3 className="text-lg font-semibold text-white">
            {category.name} - Select Subcategory
          </h3>
        </div>
      )}

      {/* Subcategory chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
      >
        <AnimatePresence mode="popLayout">
          {subcategories.map((subcategory) => (
            <SubcategoryChip
              key={subcategory.id}
              subcategory={subcategory}
              isSelected={subcategory.id === selectedSubcategoryId}
              onSelect={onSubcategorySelect}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

interface SubcategoryChipProps {
  subcategory: Subcategory;
  isSelected: boolean;
  onSelect: (subcategory: Subcategory) => void;
}

function SubcategoryChip({
  subcategory,
  isSelected,
  onSelect,
}: SubcategoryChipProps) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onSelect(subcategory)}
      className={`
        relative px-4 py-2 rounded-lg text-sm font-medium
        transition-all duration-200
        ${
          isSelected
            ? "bg-gradient-to-r from-naija-green to-neon-cyan text-white shadow-lg shadow-neon-cyan/50"
            : "bg-dark-card text-gray-300 hover:bg-dark-border hover:text-white"
        }
      `}
    >
      {/* Neon border for selected */}
      {isSelected && (
        <motion.div
          layoutId="selected-border"
          className="absolute inset-0 rounded-lg border-2 border-neon-cyan"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      <span className="relative z-10">{subcategory.name}</span>
    </motion.button>
  );
}
