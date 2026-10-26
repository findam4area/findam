"use client";

import { useState } from "react";
import { X, Loader2, Plus, Trash2, Package } from "lucide-react";
import type { InventoryItem, InventoryVariant } from "@/lib/types";

interface VariantManagerProps {
  item: InventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function VariantManager({
  item,
  onClose,
  onSuccess,
}: VariantManagerProps) {
  const [variants, setVariants] = useState<InventoryVariant[]>(
    (item.variants as InventoryVariant[]) || [],
  );
  const [unitPrice, setUnitPrice] = useState(item.unit_price);
  const [lowStockThreshold, setLowStockThreshold] = useState(
    item.low_stock_threshold,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: `variant-${Date.now()}`,
        name: "",
        attributes: {},
        stock: 0,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (
    index: number,
    field: keyof InventoryVariant,
    value: any,
  ) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate variants
    if (variants.length === 0) {
      setError("At least one variant is required");
      setIsSubmitting(false);
      return;
    }

    for (const variant of variants) {
      if (!variant.name.trim()) {
        setError("All variants must have a name");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch(
        `/api/inventory/${item.listing_id}/variants`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variants,
            unit_price: unitPrice,
            low_stock_threshold: lowStockThreshold,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update variants");
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update variants",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const listing = item.listing as any;
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-2xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-naija-orange" />
            <h2 className="text-xl font-bold text-white">Manage Variants</h2>
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
            Total stock across variants: {totalStock}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="variant-unit-price"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Unit Price (₦)
              </label>
              <input
                id="variant-unit-price"
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
              <label
                htmlFor="variant-threshold"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Low Stock Threshold
              </label>
              <input
                id="variant-threshold"
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) =>
                  setLowStockThreshold(parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-naija-orange"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300">
                Variants
              </label>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1 px-3 py-1 bg-naija-orange hover:bg-naija-orange/90 text-white text-sm rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Variant
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {variants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="p-4 bg-dark-bg border border-dark-border rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor={`variant-name-${index}`}
                            className="block text-xs text-gray-400 mb-1"
                          >
                            Variant Name
                          </label>
                          <input
                            id={`variant-name-${index}`}
                            type="text"
                            value={variant.name}
                            onChange={(e) =>
                              updateVariant(index, "name", e.target.value)
                            }
                            placeholder="e.g., Red - Large"
                            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-naija-orange"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`variant-stock-${index}`}
                            className="block text-xs text-gray-400 mb-1"
                          >
                            Stock Quantity
                          </label>
                          <input
                            id={`variant-stock-${index}`}
                            type="number"
                            min="0"
                            value={variant.stock}
                            onChange={(e) =>
                              updateVariant(
                                index,
                                "stock",
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-naija-orange"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor={`variant-sku-${index}`}
                          className="block text-xs text-gray-400 mb-1"
                        >
                          SKU (Optional)
                        </label>
                        <input
                          id={`variant-sku-${index}`}
                          type="text"
                          value={variant.sku || ""}
                          onChange={(e) =>
                            updateVariant(index, "sku", e.target.value)
                          }
                          placeholder="e.g., PROD-RED-L"
                          className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-naija-orange"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      aria-label="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {variants.length === 0 && (
                <div className="p-8 text-center border-2 border-dashed border-dark-border rounded-lg">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">
                    No variants yet. Click "Add Variant" to get started.
                  </p>
                </div>
              )}
            </div>
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
                  Saving...
                </>
              ) : (
                "Save Variants"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
