"use client";

import { useState } from "react";
import { X, Loader2, Package } from "lucide-react";
import type { InventoryItem } from "@/lib/types";

interface StockUpdateModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function StockUpdateModal({
  item,
  onClose,
  onSuccess,
}: StockUpdateModalProps) {
  const [stockQuantity, setStockQuantity] = useState(item.stock_quantity);
  const [lowStockThreshold, setLowStockThreshold] = useState(
    item.low_stock_threshold,
  );
  const [unitPrice, setUnitPrice] = useState(item.unit_price);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/inventory/${item.listing_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock_quantity: stockQuantity,
          low_stock_threshold: lowStockThreshold,
          unit_price: unitPrice,
          notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update stock");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  const listing = item.listing as any;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-naija-orange" />
            <h2 className="text-xl font-bold text-white">Update Stock</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-dark-bg rounded-lg">
          <p className="text-white font-medium text-sm">
            {listing?.title || "Unknown Listing"}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Current stock: {item.stock_quantity}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="stock-quantity"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Stock Quantity
            </label>
            <input
              id="stock-quantity"
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-naija-orange"
              required
            />
          </div>

          <div>
            <label
              htmlFor="low-stock-threshold"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Low Stock Threshold
            </label>
            <input
              id="low-stock-threshold"
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(e) =>
                setLowStockThreshold(parseInt(e.target.value) || 0)
              }
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-naija-orange"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              You'll be notified when stock falls below this level
            </p>
          </div>

          <div>
            <label
              htmlFor="unit-price"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Unit Price (₦)
            </label>
            <input
              id="unit-price"
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-naija-orange"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-naija-orange resize-none"
              placeholder="Reason for stock update..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-dark-bg hover:bg-dark-border text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-naija-orange hover:bg-naija-orange/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Stock"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
