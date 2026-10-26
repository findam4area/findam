/**
 * SaveComparisonModal Component
 * Modal for saving comparison sets
 * Requirements: 3.8
 * Tasks: 22.8
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";

interface SaveComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  listingCount: number;
}

export function SaveComparisonModal({
  isOpen,
  onClose,
  onSave,
  listingCount,
}: SaveComparisonModalProps) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a name for this comparison");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await onSave(name.trim());
      setName("");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save comparison",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setName("");
      setError("");
      onClose();
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card rounded-xl p-6 w-full max-w-md"
              role="dialog"
              aria-labelledby="save-comparison-title"
              aria-describedby="save-comparison-description"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="save-comparison-title"
                  className="text-xl font-bold flex items-center gap-2"
                >
                  <Save className="w-5 h-5 text-naija-green" />
                  Save Comparison
                </h2>
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="p-2 hover:bg-dark-bg rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-naija-green disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <p
                id="save-comparison-description"
                className="text-sm text-gray-400 mb-4"
              >
                Save this comparison of {listingCount} products for later
                review.
              </p>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="comparison-name"
                    className="block text-sm font-medium mb-2"
                  >
                    Comparison Name
                  </label>
                  <input
                    id="comparison-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., iPhone Comparison"
                    disabled={isSaving}
                    className="w-full px-4 py-2 bg-dark-bg border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-naija-green focus:border-transparent disabled:opacity-50"
                    maxLength={100}
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-500" role="alert">
                      {error}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 border border-gray-700 rounded-lg hover:bg-dark-bg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !name.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-naija-green to-neon-cyan text-white font-medium rounded-lg hover:shadow-lg hover:shadow-naija-green/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-naija-green"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
