"use client";

import { useEffect, useState } from "react";
import { X, Loader2, History, TrendingUp, TrendingDown } from "lucide-react";
import type { StockHistory } from "@/lib/types";

interface StockHistoryModalProps {
  listingId: string;
  onClose: () => void;
}

export function StockHistoryModal({
  listingId,
  onClose,
}: StockHistoryModalProps) {
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch(`/api/inventory/${listingId}/history`);

        if (!response.ok) {
          throw new Error("Failed to fetch stock history");
        }

        const data = await response.json();
        setHistory(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load stock history",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [listingId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/inventory/${listingId}/history`);

      if (!response.ok) {
        throw new Error("Failed to fetch stock history");
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load stock history",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getChangeIcon = (changeAmount: number) => {
    if (changeAmount > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (changeAmount < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      sale: "bg-blue-500/20 text-blue-500",
      restock: "bg-green-500/20 text-green-500",
      adjustment: "bg-yellow-500/20 text-yellow-500",
      return: "bg-purple-500/20 text-purple-500",
      initial: "bg-gray-500/20 text-gray-500",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${colors[reason] || colors.adjustment}`}
      >
        {reason.charAt(0).toUpperCase() + reason.slice(1)}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-naija-orange" />
            <h2 className="text-xl font-bold text-white">Stock History</h2>
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

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-naija-orange animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No stock history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-dark-bg border border-dark-border rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getChangeIcon(entry.change_amount)}
                      <div>
                        <p className="text-white font-medium text-sm">
                          {entry.previous_quantity} → {entry.new_quantity}
                        </p>
                        <p
                          className={`text-xs ${
                            entry.change_amount > 0
                              ? "text-green-500"
                              : entry.change_amount < 0
                                ? "text-red-500"
                                : "text-gray-400"
                          }`}
                        >
                          {entry.change_amount > 0 ? "+" : ""}
                          {entry.change_amount} units
                        </p>
                      </div>
                    </div>
                    {getReasonBadge(entry.change_reason)}
                  </div>

                  {entry.variant_name && (
                    <p className="text-xs text-neon-cyan mb-2">
                      Variant: {entry.variant_name}
                    </p>
                  )}

                  {entry.notes && (
                    <p className="text-sm text-gray-400 mb-2">{entry.notes}</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {new Date(entry.created_at).toLocaleString("en-NG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    {entry.changer && (
                      <span>by {entry.changer.username || "Unknown"}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-dark-border">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 bg-dark-bg hover:bg-dark-border text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
