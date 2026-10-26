"use client";

/**
 * Exchange Badge Component
 *
 * Displays "Open to Exchange" badge on listings that accept barter proposals.
 *
 * Requirements: 12.1, 12.2
 */

import { ArrowLeftRight } from "lucide-react";

interface ExchangeBadgeProps {
  variant?: "default" | "compact";
  className?: string;
}

export function ExchangeBadge({
  variant = "default",
  className = "",
}: ExchangeBadgeProps) {
  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium ${className}`}
        title="Open to Exchange"
      >
        <ArrowLeftRight className="h-3 w-3" />
        <span>Exchange</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-sm font-medium ${className}`}
    >
      <ArrowLeftRight className="h-4 w-4" />
      <span>Open to Exchange</span>
    </div>
  );
}
