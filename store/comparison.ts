/**
 * Comparison Store
 * Manages product comparison state with localStorage persistence
 * Requirements: 3.1, 3.2, 3.6, 3.7, 3.10
 * Tasks: 22.6
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Listing } from "@/lib/types";

interface ComparisonState {
  // State
  selectedListings: Listing[];
  categoryId: string | null;

  // Actions
  addListing: (listing: Listing) => { success: boolean; error?: string };
  removeListing: (listingId: string) => void;
  clearComparison: () => void;
  isInComparison: (listingId: string) => boolean;
  canAddListing: (listing: Listing) => { canAdd: boolean; error?: string };
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      selectedListings: [],
      categoryId: null,

      addListing: (listing: Listing) => {
        const state = get();

        // Validate: Check if already in comparison
        if (state.selectedListings.some((l) => l.id === listing.id)) {
          return { success: false, error: "Listing already in comparison" };
        }

        // Validate: Maximum 4 listings (Requirement 3.1)
        if (state.selectedListings.length >= 4) {
          return {
            success: false,
            error: "Maximum 4 listings allowed in comparison",
          };
        }

        // Validate: Category consistency (Requirement 3.10)
        if (state.categoryId && state.categoryId !== listing.category_id) {
          return {
            success: false,
            error: "Can only compare listings from the same category",
          };
        }

        // Add listing
        set({
          selectedListings: [...state.selectedListings, listing],
          categoryId: listing.category_id,
        });

        return { success: true };
      },

      removeListing: (listingId: string) => {
        const state = get();
        const updatedListings = state.selectedListings.filter(
          (l) => l.id !== listingId,
        );

        set({
          selectedListings: updatedListings,
          // Clear category if no listings remain
          categoryId: updatedListings.length > 0 ? state.categoryId : null,
        });
      },

      clearComparison: () => {
        set({
          selectedListings: [],
          categoryId: null,
        });
      },

      isInComparison: (listingId: string) => {
        return get().selectedListings.some((l) => l.id === listingId);
      },

      canAddListing: (listing: Listing) => {
        const state = get();

        // Check if already in comparison
        if (state.selectedListings.some((l) => l.id === listing.id)) {
          return { canAdd: false, error: "Already in comparison" };
        }

        // Check maximum limit
        if (state.selectedListings.length >= 4) {
          return { canAdd: false, error: "Maximum 4 listings" };
        }

        // Check category consistency
        if (state.categoryId && state.categoryId !== listing.category_id) {
          return { canAdd: false, error: "Different category" };
        }

        return { canAdd: true };
      },
    }),
    {
      name: "comparison-storage", // localStorage key
      // Only persist the essential data
      partialize: (state) => ({
        selectedListings: state.selectedListings,
        categoryId: state.categoryId,
      }),
    },
  ),
);
