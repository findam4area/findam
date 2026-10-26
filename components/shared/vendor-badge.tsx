/**
 * VendorBadge Component
 * 
 * Displays "Verified Vendor" badge on listings and vendor profiles.
 * Shows checkmark icon with text and tooltip explaining badge meaning.
 * 
 * Requirements: 4.5 - Display approved vendor badge on profiles and listings
 * Task: 8.13 - Create VendorBadge component
 */

import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VendorBadgeProps {
  /**
   * Optional CSS classes for styling customization
   */
  className?: string;
  
  /**
   * Size variant for different contexts
   * sm: Compact for listing cards
   * md: Standard for listing details (default)
   * lg: Prominent for vendor profiles
   */
  size?: "sm" | "md" | "lg";
  
  /**
   * Show label text alongside icon
   * @default true
   */
  showLabel?: boolean;
}

/**
 * Size configuration for responsive scaling across different contexts
 */
const SIZE_CONFIG = {
  sm: {
    icon: "h-3.5 w-3.5",
    text: "text-xs",
    padding: "px-2 py-0.5",
    gap: "gap-1",
  },
  md: {
    icon: "h-4 w-4",
    text: "text-sm",
    padding: "px-2.5 py-1",
    gap: "gap-1.5",
  },
  lg: {
    icon: "h-5 w-5",
    text: "text-base",
    padding: "px-3 py-1.5",
    gap: "gap-2",
  },
} as const;

/**
 * VendorBadge displays an approved vendor indicator with accessible styling.
 * 
 * Features:
 * - Checkmark icon with "Verified Vendor" text
 * - Tooltip on hover explaining badge meaning
 * - Responsive sizing for mobile and desktop
 * - WCAG AA contrast ratios
 * - Touch-friendly targets on mobile (min 44x44px for interactive areas)
 */
export function VendorBadge({
  className,
  size = "md",
  showLabel = true,
}: VendorBadgeProps) {
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className="relative inline-block group">
      {/* Badge */}
      <div
        className={cn(
          "inline-flex items-center rounded-full font-medium transition-all",
          "bg-naija-green/10 text-naija-green border border-naija-green/20",
          "hover:bg-naija-green/20 hover:border-naija-green/30",
          sizeConfig.gap,
          showLabel && sizeConfig.padding,
          // Ensure minimum touch target on mobile when interactive
          "min-h-[44px] sm:min-h-0",
          className,
        )}
        role="status"
        aria-label="Verified Vendor"
      >
        <BadgeCheck
          className={cn(
            sizeConfig.icon,
            "fill-naija-green text-white flex-shrink-0",
          )}
          aria-hidden="true"
        />
        {showLabel && (
          <span className={cn(sizeConfig.text, "font-semibold leading-none")}>
            Verified Vendor
          </span>
        )}
      </div>

      {/* Tooltip - Requirement 4.5: Explain badge meaning on hover */}
      <div
        className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2",
          "bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50",
          "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
          "transition-all duration-200 pointer-events-none whitespace-nowrap",
          "max-w-xs sm:max-w-sm",
        )}
        role="tooltip"
      >
        <div className="space-y-1">
          <p className="font-semibold">Verified Vendor</p>
          <p className="text-gray-300 text-[11px] whitespace-normal">
            This vendor has been manually approved by FindAm administrators after
            reviewing their business credentials and application.
          </p>
        </div>
        {/* Tooltip arrow */}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 -mt-1"
          aria-hidden="true"
        >
          <div className="border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    </div>
  );
}
