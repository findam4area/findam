import { create } from "zustand";
import type { Listing, ListingFilters } from "@/lib/types";

interface ListingsState {
  listings: Listing[];
  filters: ListingFilters;
  isLoading: boolean;
  hasMore: boolean;
  cursor?: string;
  page: number;
  isRefreshing: boolean;
  setListings: (listings: Listing[]) => void;
  addListings: (listings: Listing[]) => void;
  setFilters: (filters: Partial<ListingFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setCursor: (cursor?: string) => void;
  setPage: (page: number) => void;
  incrementPage: () => void;
  reset: () => void;
}

const initialFilters: ListingFilters = {
  sort_by: "date_desc",
};

export const useListingsStore = create<ListingsState>((set) => ({
  listings: [],
  filters: initialFilters,
  isLoading: false,
  isRefreshing: false,
  hasMore: true,
  cursor: undefined,
  page: 0,
  setListings: (listings) => set({ listings }),
  addListings: (newListings) =>
    set((state) => ({
      listings: [...state.listings, ...newListings],
    })),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      page: 0,
      cursor: undefined,
      listings: [],
    })),
  resetFilters: () =>
    set({
      filters: initialFilters,
      page: 0,
      cursor: undefined,
      listings: [],
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setHasMore: (hasMore) => set({ hasMore }),
  setCursor: (cursor) => set({ cursor }),
  setPage: (page) => set({ page }),
  incrementPage: () => set((state) => ({ page: state.page + 1 })),
  reset: () =>
    set({
      listings: [],
      filters: initialFilters,
      isLoading: false,
      isRefreshing: false,
      hasMore: true,
      cursor: undefined,
      page: 0,
    }),
}));
