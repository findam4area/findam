"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  Award,
  Crown,
  CheckCircle2,
  Phone,
  Video,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeTier } from "./verification-badge";
import { BADGE_CRITERIA } from "@/lib/services/verification-constants";

interface BadgeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: BadgeTier;
  phoneVerified: boolean;
  ninVerified: boolean;
  videoVerified: boolean;
  transactionCount: number;
  averageRating: number | null;
}

/**
 * BadgeDetailsModal Component
 * Requirements: 15.6
 * Tasks: 28.3
 *
 * Shows verification details and criteria when badge is tapped
 */
export function BadgeDetailsModal({
  isOpen,
  onClose,
  tier,
  phoneVerified,
  ninVerified,
  videoVerified,
  transactionCount,
  averageRating,
}: BadgeDetailsModalProps) {
  if (tier === "none") {
    return null;
  }

  const badges = {
    basic: {
      icon: Shield,
      label: "Basic Verified",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      description: "This seller has completed all identity verification steps.",
    },
    trusted: {
      icon: Award,
      label: "Trusted Seller",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description:
        "This seller has a proven track record of successful transactions.",
    },
    power: {
      icon: Crown,
      label: "Power Seller",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      description: "This seller is among the top performers on FindAm.",
    },
  };

  const badge = badges[tier];
  const Icon = badge.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn("p-2 rounded-full", badge.bgColor)}>
              <Icon className={cn("h-5 w-5", badge.color)} />
            </div>
            {badge.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          <p className="text-sm text-gray-400">{badge.description}</p>

          {/* Verification Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Verification Status</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <Phone
                  className={cn(
                    "h-4 w-4",
                    phoneVerified ? "text-emerald-500" : "text-gray-500",
                  )}
                />
                <span
                  className={phoneVerified ? "text-gray-300" : "text-gray-500"}
                >
                  Phone Verified
                </span>
                {phoneVerified && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield
                  className={cn(
                    "h-4 w-4",
                    ninVerified ? "text-emerald-500" : "text-gray-500",
                  )}
                />
                <span
                  className={ninVerified ? "text-gray-300" : "text-gray-500"}
                >
                  NIN Verified
                </span>
                {ninVerified && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Video
                  className={cn(
                    "h-4 w-4",
                    videoVerified ? "text-emerald-500" : "text-gray-500",
                  )}
                />
                <span
                  className={videoVerified ? "text-gray-300" : "text-gray-500"}
                >
                  Video Verified
                </span>
                {videoVerified && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                )}
              </div>
            </div>
          </div>

          {/* Performance Metrics (for Trusted and Power tiers) */}
          {(tier === "trusted" || tier === "power") && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Performance</h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Successful Transactions</span>
                  <span className="font-medium">{transactionCount}</span>
                </div>
                {averageRating !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Average Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium">
                        {averageRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Badge Criteria */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Badge Criteria</h4>
            <div className="space-y-3">
              {/* Basic Badge */}
              <div
                className={cn(
                  "p-3 rounded-lg border",
                  tier === "basic"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-dark-card border-gray-800",
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Basic Verified</span>
                </div>
                <ul className="text-xs text-gray-400 space-y-1 ml-6">
                  <li>• Phone verification</li>
                  <li>• NIN verification</li>
                  <li>• Video verification</li>
                </ul>
              </div>

              {/* Trusted Badge */}
              <div
                className={cn(
                  "p-3 rounded-lg border",
                  tier === "trusted"
                    ? "bg-blue-500/5 border-blue-500/20"
                    : "bg-dark-card border-gray-800",
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Trusted Seller</span>
                </div>
                <ul className="text-xs text-gray-400 space-y-1 ml-6">
                  <li>• All Basic Verified requirements</li>
                  <li>
                    • {BADGE_CRITERIA.trusted.transactions}+ successful
                    transactions
                  </li>
                  <li>• {BADGE_CRITERIA.trusted.minRating}+ average rating</li>
                </ul>
              </div>

              {/* Power Badge */}
              <div
                className={cn(
                  "p-3 rounded-lg border",
                  tier === "power"
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-dark-card border-gray-800",
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Power Seller</span>
                </div>
                <ul className="text-xs text-gray-400 space-y-1 ml-6">
                  <li>• All Basic Verified requirements</li>
                  <li>
                    • {BADGE_CRITERIA.power.transactions}+ successful
                    transactions
                  </li>
                  <li>• {BADGE_CRITERIA.power.minRating}+ average rating</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Benefits</h4>
            <ul className="text-xs text-gray-400 space-y-1 ml-4">
              <li>• Higher visibility in search results</li>
              <li>• Increased buyer trust</li>
              <li>• Priority in recommendations</li>
              {(tier === "trusted" || tier === "power") && (
                <li>• Enhanced seller profile</li>
              )}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
