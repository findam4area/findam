/**
 * Boost Badge Component
 * Displays "Boosted" badge on listing cards
 * Requirements: 14.3
 * Task: 34.4
 */

"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoostBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BoostBadge({ className, size = "md" }: BoostBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-md",
        sizeClasses[size],
        className,
      )}
    >
      <Zap size={iconSizes[size]} className="fill-current" />
      <span>Boosted</span>
    </div>
  );
}
