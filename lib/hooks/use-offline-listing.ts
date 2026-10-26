/**
 * useOfflineListing Hook
 * Handles offline listing creation and caching
 * Requirements: 18.4, 18.5
 */

import { useState, useEffect, useCallback } from "react";
import { pwaService } from "@/lib/services/pwa";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";

export interface ListingData {
  title: string;
  description: string;
  price?: number;
  category_id: string;
  subcategory_id?: string;
  state: string;
  area?: string;
  condition?: string;
  [key: string]: any;
}

export function useOfflineListing() {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /**
   * Create a listing (works offline)
   * Requirements: 18.5
   */
  const createListing = useCallback(
    async (listingData: ListingData) => {
      if (!user) {
        throw new Error("User must be authenticated");
      }

      setCreating(true);

      try {
        if (isOnline) {
          // Create listing directly if online
          const { data, error } = await (pwaService as any)["supabase"]
            .from("listings")
            .insert({
              ...listingData,
              user_id: user.id,
              is_active: false, // Draft until published
            })
            .select()
            .single();

          if (error) throw error;

          toast.success("Listing created successfully");
          return data;
        } else {
          // Queue for later if offline
          await pwaService.queueOfflineAction(
            user.id,
            "create_listing",
            {
              ...listingData,
              user_id: user.id,
              is_active: false,
            },
            1, // High priority
          );

          toast.info(
            "You're offline. Listing will be created when you're back online.",
          );
          return null;
        }
      } catch (error) {
        console.error("Failed to create listing:", error);
        throw error;
      } finally {
        setCreating(false);
      }
    },
    [user, isOnline],
  );

  /**
   * Cache a listing for offline viewing
   * Requirements: 18.4
   */
  const cacheListing = useCallback(
    async (listingId: string, listingData: any) => {
      if (!user) return;

      try {
        await pwaService.cacheListing(user.id, listingId, listingData);
      } catch (error) {
        console.error("Failed to cache listing:", error);
      }
    },
    [user],
  );

  /**
   * Get cached listing
   */
  const getCachedListing = useCallback(
    async (listingId: string) => {
      if (!user) return null;

      try {
        const cached = await pwaService.getCachedListing(user.id, listingId);
        return cached?.listing_data || null;
      } catch (error) {
        console.error("Failed to get cached listing:", error);
        return null;
      }
    },
    [user],
  );

  /**
   * Get all cached listings
   */
  const getCachedListings = useCallback(async () => {
    if (!user) return [];

    try {
      const cached = await pwaService.getCachedListings(user.id);
      return cached.map((c) => c.listing_data);
    } catch (error) {
      console.error("Failed to get cached listings:", error);
      return [];
    }
  }, [user]);

  /**
   * Clear cached listing
   */
  const clearCachedListing = useCallback(
    async (listingId: string) => {
      if (!user) return;

      try {
        await pwaService.clearCachedListing(user.id, listingId);
      } catch (error) {
        console.error("Failed to clear cached listing:", error);
      }
    },
    [user],
  );

  return {
    isOnline,
    creating,
    createListing,
    cacheListing,
    getCachedListing,
    getCachedListings,
    clearCachedListing,
  };
}
