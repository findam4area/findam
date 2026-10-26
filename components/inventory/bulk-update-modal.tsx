"use client";

import { useState } from "react";
import { X, Loader2, Upload, AlertCircle, CheckCircle } from "lucide-react";

interface BulkUpdateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface BulkUpdateItem {
  listing_id: string;
  stock_quantity: number;
  notes?: string;
}

export function BulkUpdateModal({ onClose, onSuccess }: BulkUpdateModalProps) {
  const [csvText, setCsvText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // Parse CSV
      const lines = csvText.trim().split("\n");
      if (lines.length < 2) {
        throw new Error("CSV must have at least a header row and one data row");
      }

      const updates: BulkUpdateItem[] = [];

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.trim());
        if (parts.length < 2) continue;

        updates.push({
          listing_id: parts[0],
          stock_quantity: parseInt(parts[1]) || 0,
          notes: parts[2] || undefined,
        });
      }

      if (updates.length === 0) {
        throw new Error("No valid updates found in CSV");
      }

      const response = await fetch("/api/inventory/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update stock");
      }

      const data = await response.json();
      setResult(data);

      if (data.failed === 0) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process bulk update",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-naija-orange" />
            <h2 className="text-xl font-bold text-white">Bulk Stock Update</h2>
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

        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 text-sm mb-2 font-medium">
            CSV Format Instructions
          </p>
          <p className="text-gray-300 text-xs mb-2">
            Paste CSV data with the following format:
          </p>
          <code className="block bg-dark-bg p-2 rounded text-xs text-gray-300 font-mono">
            listing_id,stock_quantity,notes
            <br />
            abc-123,50,Restocked from supplier
            <br />
            def-456,25,Inventory adjustment
          </code>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              result.failed === 0
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-yellow-500/10 border border-yellow-500/30"
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              {result.failed === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p
                  className={`font-medium text-sm ${
                    result.failed === 0 ? "text-green-400" : "text-yellow-400"
                  }`}
                >
                  {result.success} successful, {result.failed} failed
                </p>
                {result.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-gray-300">
                        • {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              CSV Data
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white font-mono text-sm focus:outline-none focus:border-naija-orange resize-none"
              placeholder="listing_id,stock_quantity,notes&#10;abc-123,50,Restocked&#10;def-456,25,Adjustment"
              required
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
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Update Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
