"use client";

/**
 * VerifiedBadge Component
 * Displays verification badge on business profiles with tooltip explanation
 * Requirements: 14.6, 14.7
 * Tasks: 22.1
 */

import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SIZE_CONFIG = {
  sm: {
    icon: "h-4 w-4",
    text: "text-xs",
    padding: "px-2 py-0.5",
  },
  md: {
    icon: "h-5 w-5",
    text: "text-sm",
    padding: "px-2.5 py-1",
  },
  lg: {
    icon: "h-6 w-6",
    text: "text-base",
    padding: "px-3 py-1.5",
  },
} as const;

export function VerifiedBadge({
  className,
  size = "md",
  showLabel = false,
}: VerifiedBadgeProps) {
  const sizeConfig = SIZE_CONFIG[size];

  const badge = (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-all",
        "bg-blue-500/10 text-blue-600 border border-blue-500/20",
        "hover:bg-blue-500/20",
        showLabel && sizeConfig.padding,
        className,
      )}
      aria-label="Verified Business"
    >
      <CheckCircle
        className={cn(sizeConfig.icon, "fill-blue-600 text-white")}
        aria-hidden="true"
      />
      {showLabel && <span className={sizeConfig.text}>Verified</span>}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-semibold mb-1">Verified Business</p>
          <p className="text-xs text-muted-foreground">
            This business has completed our verification process by submitting
            business registration and tax identification documents. Verified
            businesses have been reviewed and approved by our team.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
