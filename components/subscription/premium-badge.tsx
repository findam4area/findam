"use client";

/**
 * Premium Badge Component
 * Displays premium tier badges on user profiles
 * Requirements: 24.4
 */

import { Crown, Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "@/lib/services/subscription";

interface PremiumBadgeProps {
  plan: SubscriptionPlan;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const PLAN_CONFIG = {
  basic: {
    label: "Basic",
    icon: Shield,
    color: "bg-gray-100 text-gray-700 border-gray-300",
    iconColor: "text-gray-600",
  },
  pro: {
    label: "Pro",
    icon: Zap,
    color: "bg-blue-100 text-blue-700 border-blue-300",
    iconColor: "text-blue-600",
  },
  enterprise: {
    label: "Enterprise",
    icon: Crown,
    color: "bg-purple-100 text-purple-700 border-purple-300",
    iconColor: "text-purple-600",
  },
} as const;

const SIZE_CONFIG = {
  sm: {
    badge: "text-xs px-2 py-0.5",
    icon: "h-3 w-3",
  },
  md: {
    badge: "text-sm px-2.5 py-1",
    icon: "h-4 w-4",
  },
  lg: {
    badge: "text-base px-3 py-1.5",
    icon: "h-5 w-5",
  },
} as const;

export function PremiumBadge({
  plan,
  size = "md",
  showIcon = true,
  className,
}: PremiumBadgeProps) {
  const config = PLAN_CONFIG[plan];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  // Don't show badge for basic plan
  if (plan === "basic") {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 font-semibold",
        config.color,
        sizeConfig.badge,
        className,
      )}
    >
      {showIcon && <Icon className={cn(sizeConfig.icon, config.iconColor)} />}
      {config.label}
    </Badge>
  );
}
