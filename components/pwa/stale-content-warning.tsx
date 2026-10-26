"use client";

/**
 * Stale Content Warning Component
 * Displays a warning when cached data is older than 24 hours
 * Requirements: 17.8
 */

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface StaleContentWarningProps {
  timestamp: number; // Unix timestamp in milliseconds
  onRefresh?: () => void;
  className?: string;
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function StaleContentWarning({
  timestamp,
  onRefresh,
  className = "",
}: StaleContentWarningProps) {
  const [isStale, setIsStale] = useState(false);
  const [age, setAge] = useState("");

  useEffect(() => {
    const checkStale = () => {
      const now = Date.now();
      const age = now - timestamp;
      const stale = age > TWENTY_FOUR_HOURS;

      setIsStale(stale);

      if (stale) {
        // Calculate human-readable age
        const hours = Math.floor(age / (60 * 60 * 1000));
        const days = Math.floor(hours / 24);

        if (days > 0) {
          setAge(`${days} day${days > 1 ? "s" : ""} ago`);
        } else {
          setAge(`${hours} hour${hours > 1 ? "s" : ""} ago`);
        }
      }
    };

    checkStale();

    // Check every minute
    const interval = setInterval(checkStale, 60 * 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  if (!isStale) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`bg-amber-50 border border-amber-200 rounded-lg p-3 ${className}`}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">
              This content may be outdated
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Last updated {age}. Connect to the internet to see the latest
              information.
            </p>
          </div>
          {onRefresh && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              className="flex-shrink-0 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
              aria-label="Refresh content"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Inline Stale Badge
 * Shows a small badge when content is stale
 */
export function StaleBadge({ timestamp }: { timestamp: number }) {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const checkStale = () => {
      const now = Date.now();
      const age = now - timestamp;
      setIsStale(age > TWENTY_FOUR_HOURS);
    };

    checkStale();
    const interval = setInterval(checkStale, 60 * 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  if (!isStale) return null;

  return (
    <span
      className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded"
      role="status"
      aria-label="Content may be outdated"
    >
      <AlertTriangle className="h-3 w-3" />
      <span>May be outdated</span>
    </span>
  );
}

/**
 * Hook to check if content is stale
 */
export function useStaleContent(timestamp: number) {
  const [isStale, setIsStale] = useState(false);
  const [ageInHours, setAgeInHours] = useState(0);

  useEffect(() => {
    const checkStale = () => {
      const now = Date.now();
      const age = now - timestamp;
      const hours = age / (60 * 60 * 1000);

      setIsStale(age > TWENTY_FOUR_HOURS);
      setAgeInHours(hours);
    };

    checkStale();
    const interval = setInterval(checkStale, 60 * 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return { isStale, ageInHours };
}
