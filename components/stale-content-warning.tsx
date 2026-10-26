"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, RefreshCw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StaleContentWarningProps {
  /**
   * Timestamp when the content was last fetched (in milliseconds)
   */
  lastUpdated: number;
  /**
   * Callback to refresh the content
   */
  onRefresh?: () => void | Promise<void>;
  /**
   * Whether the refresh is in progress
   */
  isRefreshing?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export function StaleContentWarning({
  lastUpdated,
  onRefresh,
  isRefreshing = false,
  className,
}: StaleContentWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const now = Date.now();
  const ageInMs = now - lastUpdated;
  const isStale = ageInMs > STALE_THRESHOLD_MS;

  const getAgeText = (ageMs: number): string => {
    const hours = Math.floor(ageMs / (60 * 60 * 1000));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    }
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
      setIsDismissed(true);
      // Auto-undismiss after a delay to show if it becomes stale again
      setTimeout(() => setIsDismissed(false), 5000);
    }
  };

  if (!isStale || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className={cn("overflow-hidden", className)}
      >
        <div
          className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
          role="alert"
          aria-live="polite"
        >
          {/* Icon and Message */}
          <div className="flex items-center gap-3 flex-1">
            <Clock
              className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <div className="flex-1 text-sm">
              <p className="font-medium">This content may be outdated</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Last updated {getAgeText(ageInMs)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  "bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800",
                  "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
                  "dark:bg-amber-700 dark:hover:bg-amber-600",
                  isRefreshing && "cursor-not-allowed opacity-60"
                )}
                aria-label={
                  isRefreshing ? "Refreshing content..." : "Refresh content"
                }
              >
                <RefreshCw
                  className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                  aria-hidden="true"
                />
                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
            )}

            <button
              onClick={() => setIsDismissed(true)}
              className={cn(
                "rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                "text-amber-700 hover:bg-amber-100 active:bg-amber-200",
                "dark:text-amber-300 dark:hover:bg-amber-900 dark:active:bg-amber-800",
                "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              )}
              aria-label="Dismiss warning"
            >
              Dismiss
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
