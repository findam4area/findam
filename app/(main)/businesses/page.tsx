"use client";

// Business Directory page with filtering
// Requirements: 21.3, 21.4, 21.6

import { useState, useEffect } from "react";
import { BusinessCard } from "@/components/business/BusinessCard";
import { getBusinesses } from "@/lib/services/business";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Filter,
  Loader2,
  Building2,
  CheckCircle,
} from "lucide-react";
import { states } from "nigeria-states-lgas";

export default function BusinessDirectoryPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedLGA, setSelectedLGA] = useState<string>("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("id, name, icon")
        .order("display_order");

      if (data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  // Fetch businesses based on filters
  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      try {
        const data = await getBusinesses({
          category_id: selectedCategory || undefined,
          state: selectedState || undefined,
          lga: selectedLGA || undefined,
          is_verified: verifiedOnly ? true : undefined,
          search: searchQuery || undefined,
          limit: 50,
        });

        setBusinesses(data);
      } catch (error) {
        console.error("Failed to fetch businesses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [searchQuery, selectedCategory, selectedState, selectedLGA, verifiedOnly]);

  // Get LGAs for selected state
  const selectedStateData = Array.isArray(states) 
    ? states.find((s) => s.name === selectedState)
    : null;
  const lgas = selectedStateData?.lgas || [];

  return (
    <div className="min-h-screen bg-dark-bg pb-20">
      {/* Header */}
      <div className="border-b border-dark-border bg-dark-card/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-naija-green/20">
              <Building2 className="h-6 w-6 text-naija-green" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Business Directory
              </h1>
              <p className="text-sm text-gray-400">
                Discover verified businesses across Nigeria
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-dark-border bg-dark-card py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-naija-green focus:outline-none"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-gray-400">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-dark-border bg-dark-card px-4 py-2 text-sm text-white focus:border-naija-green focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedLGA(""); // Reset LGA when state changes
              }}
              className="rounded-lg border border-dark-border bg-dark-card px-4 py-2 text-sm text-white focus:border-naija-green focus:outline-none"
            >
              <option value="">All States</option>
              {Array.isArray(states) && states.map((state) => (
                <option key={state.name} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>

            {/* LGA Filter */}
            {selectedState && (
              <select
                value={selectedLGA}
                onChange={(e) => setSelectedLGA(e.target.value)}
                className="rounded-lg border border-dark-border bg-dark-card px-4 py-2 text-sm text-white focus:border-naija-green focus:outline-none"
              >
                <option value="">All LGAs</option>
                {lgas.map((lga) => (
                  <option key={lga.name} value={lga.name}>
                    {lga.name}
                  </option>
                ))}
              </select>
            )}

            {/* Verified Only Toggle */}
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                verifiedOnly
                  ? "border-naija-green bg-naija-green/20 text-naija-green"
                  : "border-dark-border bg-dark-card text-gray-400 hover:text-white"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Verified Only</span>
            </button>

            {/* Clear Filters */}
            {(selectedCategory ||
              selectedState ||
              selectedLGA ||
              verifiedOnly ||
              searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory("");
                  setSelectedState("");
                  setSelectedLGA("");
                  setVerifiedOnly(false);
                  setSearchQuery("");
                }}
                className="text-sm text-gray-400 hover:text-white"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-400">
          {loading ? (
            <span>Loading businesses...</span>
          ) : (
            <span>
              Found {businesses.length} business{businesses.length !== 1 ? "es" : ""}
            </span>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-naija-green" />
          </div>
        )}

        {/* Business Grid */}
        {!loading && businesses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {businesses.map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <BusinessCard business={business} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && businesses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-dark-card">
              <Building2 className="h-10 w-10 text-gray-600" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              No businesses found
            </h3>
            <p className="max-w-md text-sm text-gray-400">
              Try adjusting your filters or search query to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
