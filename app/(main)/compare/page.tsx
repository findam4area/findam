/**
 * Product Comparison Page
 * Side-by-side comparison of selected products
 * Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 * Tasks: 22.2, 22.5, 22.6, 22.8
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useComparisonStore } from "@/store/comparison";
import { ComparisonGrid, SaveComparisonModal } from "@/components/comparison";
import { toast } from "sonner";

export default function ComparePage() {
  const router = useRouter();
  const { selectedListings, removeListing, clearComparison } =
    useComparisonStore();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect if less than 2 listings
  useEffect(() => {
    if (isMounted && selectedListings.length < 2) {
      toast.error("Please select at least 2 products to compare");
      router.push("/feed");
    }
  }, [isMounted, selectedListings.length, router]);

  const handleSaveComparison = async (name: string) => {
    try {
      // Call API to save comparison
      const response = await fetch("/api/comparison/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          listing_ids: selectedListings.map((l) => l.id),
          category_id: selectedListings[0]?.category_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save comparison");
      }

      toast.success("Comparison saved successfully!");
    } catch (error) {
      toast.error("Failed to save comparison");
      throw error;
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all comparisons?")) {
      clearComparison();
      router.push("/feed");
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-naija-green"></div>
      </div>
    );
  }

  // Show loading if redirecting
  if (selectedListings.length < 2) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-naija-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-naija-green rounded-lg p-2"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-gray-700 rounded-lg hover:border-naija-green transition-colors focus:outline-none focus:ring-2 focus:ring-naija-green"
                aria-label="Save comparison"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </button>

              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-4 py-2 bg-dark-card border border-gray-700 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Clear all comparisons"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2">Compare Products</h1>
          <p className="text-gray-400">
            Comparing {selectedListings.length} products side-by-side
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <ComparisonGrid listings={selectedListings} onRemove={removeListing} />

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 bg-dark-card border border-gray-800 rounded-lg"
        >
          <p className="text-sm text-gray-400 text-center">
            Items highlighted in{" "}
            <span className="text-naija-green font-medium">green</span>{" "}
            represent the best value in each category
          </p>
        </motion.div>
      </div>

      {/* Save Comparison Modal */}
      <SaveComparisonModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveComparison}
        listingCount={selectedListings.length}
      />
    </div>
  );
}
