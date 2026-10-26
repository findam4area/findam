"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StaleContentWarningProps {
  timestamp: number;
  contentType?: string;
}

/**
 * StaleContentWarning Component
 * Displays a warning when cached content is older than 24 hours
 * 
 * Requirements: 17.8, 17.9
 */
export function StaleContentWarning({
  timestamp,
  contentType = "content",
}: StaleContentWarningProps) {
  const [isStale, setIsStale] = useState(false);
  const [age, setAge] = useState("");

  useEffect(() => {
    const checkStale = () => {
      const now = Date.now();
      const ageInHours = (now - timestamp) / (1000 * 60 * 60);
      const ageInDays = Math.floor(ageInHours / 24);

      // Content is stale if older than 24 hours
      if (ageInHours > 24) {
        setIsStale(true);

        if (ageInDays > 0) {
          setAge(`${ageInDays} day${ageInDays > 1 ? "s" : ""}`);
        } else {
          setAge(`${Math.floor(ageInHours)} hours`);
        }
      } else {
        setIsStale(false);
      }
    };

    checkStale();

    // Check every minute
    const interval = setInterval(checkStale, 60000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <AnimatePresence>
      {isStale && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400 text-sm"
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            This {contentType} was cached {age} ago and may be outdated.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to check if content is stale
 */
export function useStaleContent(timestamp: number): {
  isStale: boolean;
  ageInHours: number;
  ageInDays: number;
} {
  const [isStale, setIsStale] = useState(false);
  const [ageInHours, setAgeInHours] = useState(0);
  const [ageInDays, setAgeInDays] = useState(0);

  useEffect(() => {
    const checkStale = () => {
      const now = Date.now();
      const hours = (now - timestamp) / (1000 * 60 * 60);
      const days = Math.floor(hours / 24);

      setAgeInHours(hours);
      setAgeInDays(days);
      setIsStale(hours > 24);
    };

    checkStale();

    // Check every minute
    const interval = setInterval(checkStale, 60000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return { isStale, ageInHours, ageInDays };
}
