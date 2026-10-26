"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ListingCard } from "@/components/listing/listing-card";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import type { Listing } from "@/lib/types";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

export function SavedListingsContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchSavedListings();
    }
  }, [user, authLoading, router]);

  const fetchSavedListings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/listings/saved");

      if (!response.ok) {
        throw new Error("Failed to fetch saved listings");
      }

      const data = await response.json();
      setListings(data.data || []);
    } catch (err: any) {
      console.error("Error fetching saved listings:", err);
      setError(err.message || "Failed to load saved listings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsave = async (listingId: string) => {
    try {
      const response = await fetch(`/api/listings/${listingId}/save`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unsave listing");
      }

      // Remove from local state
      setListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch (err) {
      console.error("Error unsaving listing:", err);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="glass-card rounded-xl overflow-hidden animate-pulse"
          >
            <div className="aspect-[4/3] bg-dark-card" />
            <div className="p-4 space-y-3">
              <div className="h-6 bg-dark-card rounded" />
              <div className="h-8 bg-dark-card rounded w-1/2" />
              <div className="h-4 bg-dark-card rounded" />
              <div className="h-4 bg-dark-card rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <svg
          className="w-16 h-16 text-red-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-xl font-semibold mb-2">Error Loading Listings</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchSavedListings}
          className="px-6 py-2 bg-naija-green rounded-lg hover:bg-naija-green/80 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-12 text-center"
      >
        <svg
          className="w-24 h-24 text-gray-600 mx-auto mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        <h3 className="text-2xl font-semibold mb-3">No Saved Listings Yet</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Start exploring and save listings you're interested in. They'll appear
          here for easy access later.
        </p>
        <button
          onClick={() => router.push("/feed")}
          className="px-8 py-3 bg-gradient-to-r from-naija-green to-neon-cyan rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Explore Listings
        </button>
      </motion.div>
    );
  }

  return (
    <PullToRefresh onRefresh={fetchSavedListings}>
      <div>
        <div className="mb-4 text-sm text-gray-400">
          {listings.length} {listings.length === 1 ? "listing" : "listings"}{" "}
          saved
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ListingCard
                listing={listing}
                onSave={() => handleUnsave(listing.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </PullToRefresh>
  );
}
