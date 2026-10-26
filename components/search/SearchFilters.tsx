"use client";

import { useState, useEffect } from "react";
import { MapPin, Star, DollarSign, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import type { BusinessSearchFilters } from "@/lib/types/business-profile";

interface SearchFiltersProps {
  filters: BusinessSearchFilters;
  onFiltersChange: (filters: BusinessSearchFilters) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

/**
 * SearchFilters component for business search
 * 
 * Features:
 * - Location filter with radius selector (5km, 10km, 25km, 50km, 80km)
 * - Geolocation permission request for current location
 * - Rating filter with options (3.0+, 3.5+, 4.0+, 4.5+, 5.0)
 * - Price range filter (Budget, Moderate, Premium, Luxury)
 * - Service attributes checkboxes (delivery, online, in-person, 24/7, emergency)
 * - Sort by selector (relevance, rating, review_count, distance, name)
 * - Verified businesses only checkbox
 * - Premium businesses only checkbox
 * 
 * Requirements: 6.1, 6.2, 6.6, 7.1, 8.1, 8.2, 8.3, 8.4, 8.5
 */
export function SearchFilters({
  filters,
  onFiltersChange,
  onClose,
  isOpen = true,
}: SearchFiltersProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const radiusOptions = [
    { value: 5, label: "5 km" },
    { value: 10, label: "10 km" },
    { value: 25, label: "25 km" },
    { value: 50, label: "50 km" },
    { value: 80, label: "80 km" },
  ];

  const ratingOptions = [
    { value: 3.0, label: "3.0+ stars" },
    { value: 3.5, label: "3.5+ stars" },
    { value: 4.0, label: "4.0+ stars" },
    { value: 4.5, label: "4.5+ stars" },
    { value: 5.0, label: "5.0 stars" },
  ];

  const priceRangeOptions = [
    { value: "$", label: "Budget ($)" },
    { value: "$$", label: "Moderate ($$)" },
    { value: "$$$", label: "Premium ($$$)" },
    { value: "$$$$", label: "Luxury ($$$$)" },
  ];

  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "rating", label: "Highest Rating" },
    { value: "review_count", label: "Most Reviews" },
    { value: "distance", label: "Nearest", disabled: !filters.location },
    { value: "name", label: "Name (A-Z)" },
  ];

  const serviceAttributeOptions = [
    { key: "delivery_available", label: "Delivery Available" },
    { key: "online_service", label: "Online Service" },
    { key: "in_person_service", label: "In-Person Service" },
    { key: "availability_24_7", label: "24/7 Availability" },
    { key: "emergency_service", label: "Emergency Service" },
  ];

  // Request geolocation permission and get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onFiltersChange({
          ...filters,
          location: {
            lat: latitude,
            lng: longitude,
            radius_km: filters.location?.radius_km || 10,
          },
        });
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleRadiusChange = (radius: string) => {
    if (filters.location) {
      onFiltersChange({
        ...filters,
        location: {
          ...filters.location,
          radius_km: parseInt(radius) as 5 | 10 | 25 | 50 | 80,
        },
      });
    }
  };

  const handleRatingChange = (rating: string) => {
    onFiltersChange({
      ...filters,
      min_rating: rating === "all" ? undefined : (parseFloat(rating) as 3.0 | 3.5 | 4.0 | 4.5 | 5.0),
    });
  };

  const handlePriceRangeChange = (priceRange: string) => {
    onFiltersChange({
      ...filters,
      price_range: priceRange === "all" ? undefined : (priceRange as "$" | "$$" | "$$$" | "$$$$"),
    });
  };

  const handleSortChange = (sortBy: string) => {
    onFiltersChange({
      ...filters,
      sort_by: sortBy as BusinessSearchFilters["sort_by"],
    });
  };

  const handleServiceAttributeChange = (key: string, checked: boolean) => {
    onFiltersChange({
      ...filters,
      service_attributes: {
        ...filters.service_attributes,
        [key]: checked || undefined,
      },
    });
  };

  const handleVerifiedChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      only_verified: checked || undefined,
    });
  };

  const handlePremiumChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      only_premium: checked || undefined,
    });
  };

  const clearLocationFilter = () => {
    const { location, ...rest } = filters;
    onFiltersChange(rest);
    setLocationError(null);
  };

  const clearFilters = () => {
    onFiltersChange({
      query: filters.query, // Preserve search query
    });
    setLocationError(null);
  };

  const activeFilterCount = 
    (filters.location ? 1 : 0) +
    (filters.min_rating ? 1 : 0) +
    (filters.price_range ? 1 : 0) +
    (filters.only_verified ? 1 : 0) +
    (filters.only_premium ? 1 : 0) +
    (Object.values(filters.service_attributes || {}).filter(Boolean).length);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-dark-card border border-dark-border rounded-lg p-6 space-y-6 h-fit sticky top-4"
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
                className="text-gray-400 hover:text-white transition-colors lg:hidden"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <Label htmlFor="sort" className="text-sm text-gray-300 flex items-center gap-2">
              Sort By
            </Label>
            <Select 
              value={filters.sort_by || "relevance"} 
              onValueChange={handleSortChange}
            >
              <SelectTrigger
                id="sort"
                className="bg-dark-bg border-dark-border"
              >
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location & Radius */}
          <div className="space-y-3">
            <Label className="text-sm text-gray-300 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            
            {!filters.location ? (
              <Button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                variant="outline"
                className="w-full border-dark-border hover:bg-dark-bg"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Use My Location
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg border border-dark-border">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin className="h-4 w-4 text-green-400" />
                    <span>Using your location</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearLocationFilter}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Clear location filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div>
                  <Label htmlFor="radius" className="text-xs text-gray-400">
                    Search Radius
                  </Label>
                  <Select 
                    value={filters.location.radius_km.toString()} 
                    onValueChange={handleRadiusChange}
                  >
                    <SelectTrigger
                      id="radius"
                      className="bg-dark-bg border-dark-border mt-1"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {radiusOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {locationError && (
              <p className="text-xs text-red-400 mt-2">{locationError}</p>
            )}
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label htmlFor="rating" className="text-sm text-gray-300 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Minimum Rating
            </Label>
            <Select 
              value={filters.min_rating?.toString() || "all"} 
              onValueChange={handleRatingChange}
            >
              <SelectTrigger
                id="rating"
                className="bg-dark-bg border-dark-border"
              >
                <SelectValue placeholder="Any rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any rating</SelectItem>
                {ratingOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm text-gray-300 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price Range
            </Label>
            <Select 
              value={filters.price_range || "all"} 
              onValueChange={handlePriceRangeChange}
            >
              <SelectTrigger
                id="price"
                className="bg-dark-bg border-dark-border"
              >
                <SelectValue placeholder="Any price range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any price range</SelectItem>
                {priceRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Attributes */}
          <div className="space-y-3">
            <Label className="text-sm text-gray-300">Service Attributes</Label>
            <div className="space-y-2">
              {serviceAttributeOptions.map((option) => (
                <div key={option.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.key}
                    checked={filters.service_attributes?.[option.key as keyof typeof filters.service_attributes] || false}
                    onCheckedChange={(checked) => 
                      handleServiceAttributeChange(option.key, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={option.key}
                    className="text-sm text-gray-300 cursor-pointer select-none"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Business Status */}
          <div className="space-y-3">
            <Label className="text-sm text-gray-300">Business Status</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={filters.only_verified || false}
                  onCheckedChange={handleVerifiedChange}
                />
                <label
                  htmlFor="verified"
                  className="text-sm text-gray-300 cursor-pointer select-none"
                >
                  Verified businesses only
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="premium"
                  checked={filters.only_premium || false}
                  onCheckedChange={handlePremiumChange}
                />
                <label
                  htmlFor="premium"
                  className="text-sm text-gray-300 cursor-pointer select-none"
                >
                  Premium businesses only
                </label>
              </div>
            </div>
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
