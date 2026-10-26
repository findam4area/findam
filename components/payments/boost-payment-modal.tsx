"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, TrendingUp, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRICING } from "@/lib/utils/premium";

interface BoostPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
}

export function BoostPaymentModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
}: BoostPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBoostPayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize payment
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_type: "boost",
          listing_id: listingId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to initialize payment");
      }

      const { authorization_url } = await response.json();

      // Redirect to Paystack checkout
      window.location.href = authorization_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-dark-card border border-dark-border rounded-2xl max-w-md w-full p-6 glass-card">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-naija-orange to-neon-pink flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Boost Listing
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Listing Info */}
              <div className="mb-6 p-4 bg-dark-bg rounded-lg border border-dark-border">
                <p className="text-sm text-gray-400 mb-1">Boosting</p>
                <p className="text-white font-medium truncate">
                  {listingTitle}
                </p>
              </div>

              {/* Benefits */}
              <div className="mb-6 space-y-3">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Boost Benefits
                </h3>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-naija-green/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-naija-green" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Priority Placement
                    </p>
                    <p className="text-xs text-gray-400">
                      Appear at the top of the For You feed
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-4 h-4 text-neon-cyan" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      10x More Views
                    </p>
                    <p className="text-xs text-gray-400">
                      Reach thousands more potential buyers
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neon-pink/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-neon-pink" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      7 Days Active
                    </p>
                    <p className="text-xs text-gray-400">
                      Your boost lasts for a full week
                    </p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 p-4 bg-gradient-to-br from-naija-orange/10 to-neon-pink/10 rounded-lg border border-naija-orange/20">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Boost Price</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      ₦{PRICING.BOOST.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">for 7 days</p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBoostPayment}
                  className="flex-1 bg-gradient-to-r from-naija-orange to-neon-pink hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Boost Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
