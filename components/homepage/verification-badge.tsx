"use client";

import { Phone, Shield, Video, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationBadgeProps } from "./types";

/**
 * VerificationBadge Component
 * 
 * Display verification status with tooltips explaining each verification type.
 * 
 * Requirements:
 * - 4.3: Display verification badges (phone, NIN, video)
 * - 4.9: Add tooltips explaining each verification type
 * - Support multiple sizes (sm, md, lg)
 */

const verificationConfig = {
  phone: {
    icon: Phone,
    label: "Phone Verified",
    tooltip: "Phone number verified via SMS",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  nin: {
    icon: Shield,
    label: "NIN Verified",
    tooltip: "National Identity Number verified",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  video: {
    icon: Video,
    label: "Video Verified",
    tooltip: "Identity verified via video call",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  full: {
    icon: CheckCircle,
    label: "Fully Verified",
    tooltip: "All verification methods completed",
    color: "text-naija-green",
    bgColor: "bg-naija-green/10",
    borderColor: "border-naija-green/30",
  },
};

const sizeConfig = {
  sm: {
    container: "px-2 py-1",
    icon: "h-3 w-3",
    text: "text-xs",
  },
  md: {
    container: "px-3 py-1.5",
    icon: "h-4 w-4",
    text: "text-sm",
  },
  lg: {
    container: "px-4 py-2",
    icon: "h-5 w-5",
    text: "text-base",
  },
};

export function VerificationBadge({
  type,
  size = "md",
  showTooltip = true,
  className,
}: VerificationBadgeProps) {
  const config = verificationConfig[type];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className="relative inline-flex group">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border",
          config.bgColor,
          config.borderColor,
          sizeStyles.container,
          className
        )}
        role="status"
        aria-label={config.label}
      >
        <Icon className={cn(config.color, sizeStyles.icon)} aria-hidden="true" />
        <span className={cn("font-medium", config.color, sizeStyles.text)}>
          {type === "full" ? "Verified" : type.toUpperCase()}
        </span>
      </div>

      {/* Tooltip - Requirement 4.9 */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 pointer-events-none"
          role="tooltip"
        >
          {config.tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
