"use client";

/**
 * Purchase Modal Component
 *
 * Allows viewers to purchase products without leaving the live session.
 *
 * Requirements: 2.6
 * Task: 19.6
 */

import { useState, useEffect } from "react";
import { X, ShoppingCart, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface PurchaseModalProps {
  listingId: string;
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ListingDetails {
  id: string;
  title: string;
  price: number;
  currency: string;
  images: string[];
  description: string;
  user_id: string;
  seller?: {
    username: string;
    avatar_url: string | null;
  };
}

export function PurchaseModal({
  listingId,
  sessionId,
  isOpen,
  onClose,
  onSuccess,
}: PurchaseModalProps) {
  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Fetch listing details
  useEffect(() => {
    if (!isOpen || !listingId) return;

    const fetchListing = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const { data, error: fetchError } = await (
          supabase.from("listings") as any
        )
          .select(
            `
            *,
            seller:users!user_id(username, avatar_url)
          `,
          )
          .eq("id", listingId)
          .single();

        if (fetchError) throw fetchError;

        setListing(data as any);
      } catch (err) {
        console.error("Failed to fetch listing:", err);
        setError("Failed to load product details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [isOpen, listingId]);

  // Handle purchase
  const handlePurchase = async () => {
    if (!listing || !deliveryAddress.trim()) {
      setError("Please enter a delivery address");
      return;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to purchase");
      }

      // Create escrow transaction
      const response = await fetch("/api/escrow/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: listing.id,
          buyerId: user.id,
          sellerId: listing.user_id,
          amount: listing.price,
          deliveryAddress: deliveryAddress.trim(),
          source: "live_session",
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create transaction");
      }

      const data = await response.json();

      // Redirect to Paystack payment page
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error("Purchase failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to complete purchase",
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-modal-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2
            id="purchase-modal-title"
            className="text-xl font-semibold text-gray-900 dark:text-white"
          >
            Complete Purchase
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error && !listing ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : listing ? (
            <div className="space-y-6">
              {/* Product Info */}
              <div className="flex gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {listing.images && listing.images.length > 0 ? (
                    <Image
                      src={listing.images[0]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingCart className="w-12 h-12" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {listing.title}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    ₦{listing.price.toLocaleString()}
                  </p>
                  {listing.seller && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Sold by {listing.seller.username}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label
                  htmlFor="delivery-address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Delivery Address *
                </label>
                <textarea
                  id="delivery-address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your full delivery address..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Info Box */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Secure Payment with Escrow
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Your payment is held securely until delivery</li>
                  <li>• Seller ships after payment confirmation</li>
                  <li>• Funds released after you confirm delivery</li>
                  <li>• Full refund if item not as described</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isPurchasing}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={isPurchasing || !deliveryAddress.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>Proceed to Payment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
