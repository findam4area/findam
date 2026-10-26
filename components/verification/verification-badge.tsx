"use client";

import { Shield, Award, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { BadgeDetailsModal } from "./badge-details-modal";

export type BadgeTier = "none" | "basic" | "trusted" | "power";

interface VerificationBadgeProps {
  tier: BadgeTier;
  className?: string;
  showLabel?: boolean;
  onClick?: () => void;
  // Badge details for modal
  phoneVerified?: boolean;
  ninVerified?: boolean;
  videoVerified?: boolean;
  transactionCount?: number;
  averageRating?: number | null;
}

/**
 * VerificationBadge Component
 * Requirements: 15.1, 15.8
 * Tasks: 28.1
 *
 * Displays verification badge with tier-based colors:
 * - Basic: Green (#10b981)
 * - Trusted: Blue (#3b82f6)
 * - Power: Gold (#f59e0b)
 */
export function VerificationBadge({
  tier,
  className,
  showLabel = false,
  onClick,
  phoneVerified = false,
  ninVerified = false,
  videoVerified = false,
  transactionCount = 0,
  averageRating = null,
}: VerificationBadgeProps) {
  const [showModal, setShowModal] = useState(false);

  if (tier === "none") {
    return null;
  }

  const badges = {
    basic: {
      icon: Shield,
      label: "Basic Verified",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    trusted: {
      icon: Award,
      label: "Trusted Seller",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    power: {
      icon: Crown,
      label: "Power Seller",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
  };

  const badge = badges[tier];
  const Icon = badge.icon;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      setShowModal(true);
    }
  };

  if (showLabel) {
    return (
      <>
        <button
          onClick={handleClick}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all hover:scale-105",
            badge.bgColor,
            badge.color,
            badge.borderColor,
            "cursor-pointer hover:opacity-80",
            className,
          )}
          aria-label={`${badge.label} - Click for details`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{badge.label}</span>
        </button>

        <BadgeDetailsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          tier={tier}
          phoneVerified={phoneVerified}
          ninVerified={ninVerified}
          videoVerified={videoVerified}
          transactionCount={transactionCount}
          averageRating={averageRating}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center rounded-full p-1.5 border transition-all hover:scale-110",
          badge.bgColor,
          badge.borderColor,
          "cursor-pointer hover:opacity-80",
          className,
        )}
        title={`${badge.label} - Click for details`}
        aria-label={`${badge.label} - Click for details`}
      >
        <Icon className={cn("h-4 w-4", badge.color)} />
      </button>

      <BadgeDetailsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        tier={tier}
        phoneVerified={phoneVerified}
        ninVerified={ninVerified}
        videoVerified={videoVerified}
        transactionCount={transactionCount}
        averageRating={averageRating}
      />
    </>
  );
}
