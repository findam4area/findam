"use client";

/**
 * Product Pins Component
 *
 * Displays pinned products during live sessions with buy buttons.
 * Allows sellers to pin/unpin up to 5 products.
 *
 * Requirements: 2.4, 2.5
 * Task: 19.4
 */

import { useState, useEffect } from "react";
import { X, ShoppingCart, Pin, PinOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { PinnedProduct } from "@/lib/types";
import Image from "next/image";

interface ProductPinsProps {
  sessionId: string;
  isHost?: boolean;
  onPurchase?: (listingId: string) => void;
  className?: string;
}

interface PinnedProductWithDetails extends PinnedProduct {
  listing?: {
    id: string;
    title: string;
    price: number;
    images: string[];
    is_active: boolean;
  };
}

export function ProductPins({
  sessionId,
  isHost = false,
  onPurchase,
  className = "",
}: ProductPinsProps) {
  const [pinnedProducts, setPinnedProducts] = useState<
    PinnedProductWithDetails[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pinned products with listing details
  useEffect(() => {
    const fetchPinnedProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Fetch session with pinned products
        const { data: session, error: sessionError } = await supabase
          .from("live_sessions")
          .select("pinned_products")
          .eq("id", sessionId)
          .single();

        if (sessionError) throw sessionError;

        const pinnedProductsData = (session?.pinned_products ||
          []) as any as PinnedProduct[];

        // Fetch listing details for each pinned product
        if (pinnedProductsData.length > 0) {
          const listingIds = pinnedProductsData.map((p) => p.listing_id);

          const { data: listings, error: listingsError } = await (
            supabase.from("listings") as any
          )
            .select("id, title, price, images, is_active")
            .in("id", listingIds);

          if (listingsError) throw listingsError;

          // Combine pinned products with listing details
          const productsWithDetails = pinnedProductsData.map((pinned) => ({
            ...pinned,
            listing: listings?.find((l: any) => l.id === pinned.listing_id),
          }));

          setPinnedProducts(productsWithDetails);
        } else {
          setPinnedProducts([]);
        }
      } catch (err) {
        console.error("Failed to fetch pinned products:", err);
        setError("Failed to load pinned products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPinnedProducts();

    // Subscribe to real-time updates
    const supabase = createClient();
    const channel = supabase
      .channel(`pinned-products-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_sessions",
          filter: `id=eq.${sessionId}`,
        },
        () => {
          fetchPinnedProducts();
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  // Unpin product (host only)
  const handleUnpin = async (listingId: string) => {
    if (!isHost) return;

    try {
      const supabase = createClient();

      const { error: unpinError } = await supabase.rpc(
        "unpin_product_from_session",
        {
          session_id_param: sessionId,
          listing_id_param: listingId,
        },
      );

      if (unpinError) throw unpinError;

      // Update local state
      setPinnedProducts((prev) =>
        prev.filter((p) => p.listing_id !== listingId),
      );
    } catch (err) {
      console.error("Failed to unpin product:", err);
      setError("Failed to unpin product");
    }
  };

  // Handle purchase
  const handlePurchase = (listingId: string) => {
    onPurchase?.(listingId);
  };

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center p-4 ${className}`}
        role="status"
        aria-label="Loading pinned products"
      >
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-center text-red-500 text-sm ${className}`}>
        {error}
      </div>
    );
  }

  if (pinnedProducts.length === 0) {
    return isHost ? (
      <div
        className={`p-4 text-center text-gray-500 dark:text-gray-400 text-sm ${className}`}
      >
        <Pin className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No products pinned yet</p>
        <p className="text-xs mt-1">Pin up to 5 products to showcase</p>
      </div>
    ) : null;
  }

  return (
    <div
      className={`space-y-3 ${className}`}
      role="region"
      aria-label="Pinned products"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Pin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Featured Products
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {pinnedProducts.length}/5
          </span>
        </div>
      </div>

      {/* Product Cards */}
      <div className="space-y-2 px-4">
        {pinnedProducts.map((product) => {
          const listing = product.listing;

          if (!listing) return null;

          return (
            <div
              key={product.listing_id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-3">
                {/* Product Image */}
                <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {listing.images && listing.images.length > 0 ? (
                    <Image
                      src={listing.images[0]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {listing.title}
                  </h4>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                    ₦{listing.price.toLocaleString()}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-2">
                    {!isHost && listing.is_active && (
                      <button
                        onClick={() => handlePurchase(listing.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        aria-label={`Buy ${listing.title}`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Buy Now</span>
                      </button>
                    )}

                    {isHost && (
                      <button
                        onClick={() => handleUnpin(listing.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                        aria-label={`Unpin ${listing.title}`}
                      >
                        <PinOff className="w-3.5 h-3.5" />
                        <span>Unpin</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
