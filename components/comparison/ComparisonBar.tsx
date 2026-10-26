/**
 * ComparisonBar Component
 * Floating bar showing selected items for comparison
 * Requirements: 3.2, 3.6
 * Tasks: 22.1
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { useComparisonStore } from "@/store/comparison";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useHydration } from "@/lib/hooks/useHydration";

export function ComparisonBar() {
  const hydrated = useHydration();
  const { selectedListings, removeListing, clearComparison } =
    useComparisonStore();
  const router = useRouter();

  // Don't show if no listings selected or not hydrated
  if (!hydrated || selectedListings.length === 0) {
    return null;
  }

  const handleCompare = () => {
    if (selectedListings.length >= 2) {
      router.push("/compare");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-dark-card border-t border-gray-800 shadow-2xl"
        role="region"
        aria-label="Product comparison bar"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Selected Items */}
            <div className="flex items-center gap-3 flex-1 overflow-x-auto">
              <span className="text-sm font-medium text-gray-300 whitespace-nowrap">
                Compare ({selectedListings.length}/4)
              </span>

              <div className="flex gap-2">
                {selectedListings.map((listing) => (
                  <motion.div
                    key={listing.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="relative group"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-naija-green">
                      {listing.thumbnail_url ? (
                        <Image
                          src={listing.thumbnail_url}
                          alt={listing.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-dark-bg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeListing(listing.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Remove ${listing.title} from comparison`}
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={clearComparison}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-lg"
                aria-label="Clear all comparisons"
              >
                Clear All
              </button>

              <button
                onClick={handleCompare}
                disabled={selectedListings.length < 2}
                className="px-6 py-2 bg-gradient-to-r from-naija-green to-neon-cyan text-white font-medium rounded-lg flex items-center gap-2 hover:shadow-lg hover:shadow-naija-green/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-naija-green"
                aria-label={`Compare ${selectedListings.length} products`}
              >
                Compare
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
