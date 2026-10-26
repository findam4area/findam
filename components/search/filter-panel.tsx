"use client";

import { useState, useEffect } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { LocationPicker } from "@/components/location/location-picker";
import type { ListingFilters, Category, Subcategory } from "@/lib/types";
import { LISTING_CONDITIONS, SORT_OPTIONS } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

interface FilterPanelProps {
  filters: ListingFilters;
  onFiltersChange: (filters: ListingFilters) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  onClose,
  isOpen = true,
}: FilterPanelProps) {
  const [categories, setCategories] = useState<
    (Category & { subcategories: Subcategory[] })[]
  >([]);
  const [selectedState, setSelectedState] = useState<string | undefined>(
    filters.state,
  );
  const [selectedLGA, setSelectedLGA] = useState<string | undefined>(
    filters.lga,
  );
  const [selectedWard, setSelectedWard] = useState<string | undefined>(
    filters.ward,
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.min_price || 0,
    filters.max_price || 1000000,
  ]);

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    }
    fetchCategories();
  }, []);

  const selectedCategory = categories.find(
    (cat) => cat.id === filters.category_id,
  );
  const availableSubcategories = selectedCategory?.subcategories || [];

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({
      ...filters,
      category_id: categoryId,
      subcategory_id: undefined, // Reset subcategory when category changes
    });
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    onFiltersChange({
      ...filters,
      subcategory_id: subcategoryId,
    });
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedLGA(undefined);
    setSelectedWard(undefined);
    onFiltersChange({
      ...filters,
      state,
      lga: undefined,
      ward: undefined,
    });
  };

  const handleLGAChange = (lga: string) => {
    setSelectedLGA(lga);
    setSelectedWard(undefined);
    onFiltersChange({
      ...filters,
      lga,
      ward: undefined,
    });
  };

  const handleWardChange = (ward: string) => {
    setSelectedWard(ward);
    onFiltersChange({
      ...filters,
      ward,
    });
  };

  const handleConditionChange = (condition: string) => {
    onFiltersChange({
      ...filters,
      condition: condition as "new" | "used" | "refurbished",
    });
  };

  const handleSortChange = (sortBy: string) => {
    onFiltersChange({
      ...filters,
      sort_by: sortBy as ListingFilters["sort_by"],
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
  };

  const applyPriceRange = () => {
    onFiltersChange({
      ...filters,
      min_price: priceRange[0],
      max_price: priceRange[1],
    });
  };

  const clearFilters = () => {
    setSelectedState(undefined);
    setSelectedLGA(undefined);
    setSelectedWard(undefined);
    setPriceRange([0, 1000000]);
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => key !== "search_query" && filters[key as keyof ListingFilters],
  ).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-dark-card border border-dark-border rounded-lg p-6 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-neon-cyan" />
              <h3 className="text-lg font-semibold text-white">Filters</h3>
              {activeFilterCount > 0 && (
                <span className="px-2 py-1 text-xs bg-neon-cyan/20 text-neon-cyan rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <Label htmlFor="sort" className="text-sm text-gray-300">
              Sort By
            </Label>
            <Select value={filters.sort_by} onValueChange={handleSortChange}>
              <SelectTrigger
                id="sort"
                className="bg-dark-bg border-dark-border"
              >
                <SelectValue placeholder="Select sort order" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm text-gray-300">
              Category
            </Label>
            <Select
              value={filters.category_id}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger
                id="category"
                className="bg-dark-bg border-dark-border"
              >
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory */}
          {filters.category_id && availableSubcategories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subcategory" className="text-sm text-gray-300">
                Subcategory
              </Label>
              <Select
                value={filters.subcategory_id}
                onValueChange={handleSubcategoryChange}
              >
                <SelectTrigger
                  id="subcategory"
                  className="bg-dark-bg border-dark-border"
                >
                  <SelectValue placeholder="All subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subcategories</SelectItem>
                  {availableSubcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price Range */}
          <div className="space-y-4">
            <Label className="text-sm text-gray-300">Price Range</Label>
            <div className="px-2">
              <Slider
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                onValueCommit={applyPriceRange}
                min={0}
                max={1000000}
                step={1000}
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>₦{priceRange[0].toLocaleString()}</span>
              <span>₦{priceRange[1].toLocaleString()}</span>
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label htmlFor="condition" className="text-sm text-gray-300">
              Condition
            </Label>
            <Select
              value={filters.condition}
              onValueChange={handleConditionChange}
            >
              <SelectTrigger
                id="condition"
                className="bg-dark-bg border-dark-border"
              >
                <SelectValue placeholder="Any condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any condition</SelectItem>
                {LISTING_CONDITIONS.map((condition) => (
                  <SelectItem key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location (State, LGA, Ward) */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-300">Location</Label>
            <LocationPicker
              selectedState={selectedState}
              selectedLGA={selectedLGA}
              selectedWard={selectedWard}
              onStateChange={handleStateChange}
              onLGAChange={handleLGAChange}
              onWardChange={handleWardChange}
              showWards={true}
              required={false}
            />
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full border-dark-border hover:bg-dark-bg"
            >
              Clear All Filters
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
