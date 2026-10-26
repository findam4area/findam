"use client";

/**
 * PremiumBadge Component
 * Displays premium tier badges on business profiles with tier-specific styling
 * Requirements: 15.2
 * Tasks: 22.2
 */

import { Crown, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  tier: "basic" | "pro" | "enterprise";
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const TIER_CONFIG = {
  basic: {
    label: "Premium",
    icon: Star,
    gradient: "from-gray-400 to-gray-600",
    bgColor: "bg-gradient-to-r from-gray-100 to-gray-200",
    textColor: "text-gray-700",
    borderColor: "border-gray-300",
    iconColor: "text-gray-600",
  },
  pro: {
    label: "Pro",
    icon: Zap,
    gradient: "from-blue-400 to-blue-600",
    bgColor: "bg-gradient-to-r from-blue-100 to-blue-200",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
    iconColor: "text-blue-600",
  },
  enterprise: {
    label: "Enterprise",
    icon: Crown,
    gradient: "from-purple-400 via-pink-500 to-orange-500",
    bgColor: "bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100",
    textColor: "text-purple-700",
    borderColor: "border-purple-300",
    iconColor: "text-purple-600",
  },
} as const;

const SIZE_CONFIG = {
  sm: {
    icon: "h-3 w-3",
    text: "text-xs",
    padding: "px-2 py-0.5",
  },
  md: {
    icon: "h-4 w-4",
    text: "text-sm",
    padding: "px-2.5 py-1",
  },
  lg: {
    icon: "h-5 w-5",
    text: "text-base",
    padding: "px-3 py-1.5",
  },
} as const;

export function PremiumBadge({
  tier,
  className,
  size = "md",
  showLabel = true,
}: PremiumBadgeProps) {
  const tierConfig = TIER_CONFIG[tier];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = tierConfig.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold border transition-all",
        "hover:scale-105 hover:shadow-md",
        tierConfig.bgColor,
        tierConfig.textColor,
        tierConfig.borderColor,
        showLabel && sizeConfig.padding,
        className,
      )}
      aria-label={`${tierConfig.label} Tier Business`}
    >
      <Icon
        className={cn(sizeConfig.icon, tierConfig.iconColor)}
        aria-hidden="true"
      />
      {showLabel && <span className={sizeConfig.text}>{tierConfig.label}</span>}
    </div>
  );
}
