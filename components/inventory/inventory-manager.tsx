"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Loader2,
  Plus,
  Edit,
  History,
  Download,
  Upload,
  Search,
  Filter,
  X,
} from "lucide-react";
import type { InventoryItem, InventorySummary } from "@/lib/types";
import { StockUpdateModal } from "./stock-update-modal";
import { VariantManager } from "./variant-manager";
import { StockHistoryModal } from "./stock-history-modal";
import { BulkUpdateModal } from "./bulk-update-modal";

interface InventoryManagerProps {
  userId: string;
}

export function InventoryManager({ userId }: InventoryManagerProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSoldOut, setFilterSoldOut] = useState(false);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchSummary();
  }, [filterSoldOut, filterLowStock]);

  const fetchInventory = async () => {
    try {
      const params = new URLSearchParams();
      if (filterSoldOut) params.append("is_sold_out", "true");
      if (filterLowStock) params.append("is_low_stock", "true");

      const response = await fetch(`/api/inventory?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }

      const data = await response.json();
      setInventory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/inventory/summary");

      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    }
  };

  const handleUpdateStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowUpdateModal(true);
  };

  const handleManageVariants = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowVariantModal(true);
  };

  const handleViewHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
  };

  const handleStockUpdated = () => {
    fetchInventory();
    fetchSummary();
    setShowUpdateModal(false);
    setShowVariantModal(false);
    setShowBulkModal(false);
  };

  const filteredInventory = inventory.filter((item) => {
    if (!searchQuery) return true;
    const listing = item.listing as any;
    return listing?.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-naija-orange animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Inventory Management
          </h1>
          <p className="text-gray-400">
            Track and manage your stock levels across all listings
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowBulkModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-naija-orange hover:bg-naija-orange/90 text-white rounded-lg font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          Bulk Update
        </button>
      </motion.div>

      {/* Summary Cards */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-neon-cyan" />
              <span className="text-xs text-gray-400">Total Items</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {summary.totalItems}
            </p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-naija-green" />
              <span className="text-xs text-gray-400">Total Value</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ₦{summary.totalValue.toLocaleString()}
            </p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-gray-400">Low Stock</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {summary.lowStockItems}
            </p>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <X className="w-4 h-4 text-red-500" />
              <span className="text-xs text-gray-400">Sold Out</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {summary.soldOutItems}
            </p>
          </div>
        </motion.div>
      )}

      {/* Low Stock Alerts */}
      {summary && summary.lowStockItems > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold mb-1">Low Stock Alert</h3>
              <p className="text-gray-300 text-sm">
                You have {summary.lowStockItems} item
                {summary.lowStockItems !== 1 ? "s" : ""} running low on stock.
                Consider restocking soon to avoid running out.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-dark-card border border-dark-border rounded-xl p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-naija-orange"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterLowStock
                  ? "bg-yellow-500 text-white"
                  : "bg-dark-bg text-gray-400 hover:text-white"
              }`}
            >
              Low Stock
            </button>
            <button
              type="button"
              onClick={() => setFilterSoldOut(!filterSoldOut)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterSoldOut
                  ? "bg-red-500 text-white"
                  : "bg-dark-bg text-gray-400 hover:text-white"
              }`}
            >
              Sold Out
            </button>
          </div>
        </div>
      </motion.div>

      {/* Inventory Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-dark-card border border-dark-border rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          {filteredInventory.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No inventory items found
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Create listings and set stock quantities to get started"}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-dark-bg">
                <tr>
                  <th className="text-left text-xs text-gray-400 font-medium p-4">
                    Listing
                  </th>
                  <th className="text-right text-xs text-gray-400 font-medium p-4">
                    Stock
                  </th>
                  <th className="text-right text-xs text-gray-400 font-medium p-4">
                    Threshold
                  </th>
                  <th className="text-right text-xs text-gray-400 font-medium p-4">
                    Unit Price
                  </th>
                  <th className="text-right text-xs text-gray-400 font-medium p-4">
                    Total Value
                  </th>
                  <th className="text-center text-xs text-gray-400 font-medium p-4">
                    Status
                  </th>
                  <th className="text-center text-xs text-gray-400 font-medium p-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const listing = item.listing as any;
                  const isLowStock =
                    item.stock_quantity > 0 &&
                    item.stock_quantity <= item.low_stock_threshold;

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-dark-border hover:bg-dark-bg/50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {listing?.thumbnail_url && (
                            <img
                              src={listing.thumbnail_url}
                              alt={listing.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="text-white font-medium text-sm">
                              {listing?.title || "Unknown"}
                            </p>
                            {item.has_variants && (
                              <span className="text-xs text-neon-cyan">
                                {(item.variants as any[]).length} variants
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={`text-sm font-semibold ${
                            item.is_sold_out
                              ? "text-red-500"
                              : isLowStock
                                ? "text-yellow-500"
                                : "text-white"
                          }`}
                        >
                          {item.stock_quantity}
                        </span>
                      </td>
                      <td className="p-4 text-right text-gray-400 text-sm">
                        {item.low_stock_threshold}
                      </td>
                      <td className="p-4 text-right text-white text-sm">
                        ₦{item.unit_price.toLocaleString()}
                      </td>
                      <td className="p-4 text-right text-white text-sm font-semibold">
                        ₦{item.total_value.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        {item.is_sold_out ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-500 text-xs font-medium rounded-full">
                            <X className="w-3 h-3" />
                            Sold Out
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs font-medium rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-500 text-xs font-medium rounded-full">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStock(item)}
                            className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
                            title="Update stock"
                          >
                            <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                          </button>
                          {item.has_variants && (
                            <button
                              type="button"
                              onClick={() => handleManageVariants(item)}
                              className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
                              title="Manage variants"
                            >
                              <Package className="w-4 h-4 text-gray-400 hover:text-white" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleViewHistory(item)}
                            className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
                            title="View history"
                          >
                            <History className="w-4 h-4 text-gray-400 hover:text-white" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      {showUpdateModal && selectedItem && (
        <StockUpdateModal
          item={selectedItem}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={handleStockUpdated}
        />
      )}

      {showVariantModal && selectedItem && (
        <VariantManager
          item={selectedItem}
          onClose={() => setShowVariantModal(false)}
          onSuccess={handleStockUpdated}
        />
      )}

      {showHistoryModal && selectedItem && (
        <StockHistoryModal
          listingId={selectedItem.listing_id}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showBulkModal && (
        <BulkUpdateModal
          onClose={() => setShowBulkModal(false)}
          onSuccess={handleStockUpdated}
        />
      )}
    </div>
  );
}
