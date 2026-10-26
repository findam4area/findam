"use client";

import { useState } from "react";
import { Shield, CheckCircle, Star, Users } from "lucide-react";
import { VerificationBadge } from "@/components/verification";
import { useSellerBadge } from "@/lib/hooks/useSellerBadge";
import type { Storefront, User } from "@/lib/types";
import { FollowButton } from "./follow-button";

interface StorefrontHeaderProps {
  storefront: Storefront;
  seller: User;
  stats: {
    totalSales: number;
    responseTime: string;
    memberSince: string;
    followerCount: number;
    averageRating: number;
    reviewCount: number;
  };
}

export function StorefrontHeader({
  storefront,
  seller,
  stats,
}: StorefrontHeaderProps) {
  // Fetch seller badge (Requirements: 15.1, 15.8)
  const { badge } = useSellerBadge(seller.id);

  return (
    <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="relative">
            <img
              src={seller.avatar_url || "/default-avatar.png"}
              alt={seller.username}
              className="h-24 w-24 rounded-full border-4 object-cover md:h-32 md:w-32"
              style={{
                borderColor: storefront.theme_color || "#3B82F6",
              }}
            />
            {seller.is_premium && (
              <div
                className="absolute -bottom-2 -right-2 rounded-full p-2"
                style={{
                  backgroundColor: storefront.theme_color || "#3B82F6",
                }}
              >
                <Star className="h-4 w-4 fill-white text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                {storefront.display_name || seller.username}
              </h1>
              <p className="text-sm text-gray-600">@{seller.username}</p>
            </div>
            <FollowButton
              storefrontId={storefront.id}
              themeColor={storefront.theme_color}
            />
          </div>

          {/* Verification Badges */}
          <div className="mb-3 flex flex-wrap gap-2">
            {/* Tier-based Badge - Requirements: 15.1, 15.8 */}
            {badge && badge.tier !== "none" && (
              <VerificationBadge
                tier={badge.tier}
                showLabel={true}
                phoneVerified={badge.phoneVerified}
                ninVerified={badge.ninVerified}
                videoVerified={badge.videoVerified}
                transactionCount={badge.transactionCount}
                averageRating={badge.averageRating}
              />
            )}
            {seller.is_premium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                <Star className="h-3 w-3" />
                Premium
              </span>
            )}
          </div>

          {/* Bio */}
          {storefront.bio && (
            <p className="mb-4 text-gray-700">{storefront.bio}</p>
          )}

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-gray-600">
                ({stats.reviewCount} reviews)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="font-semibold">{stats.followerCount}</span>
              <span className="text-gray-600">followers</span>
            </div>
            <div className="text-gray-600">
              <span className="font-semibold">{stats.totalSales}</span> sales
            </div>
            <div className="text-gray-600">
              Response time:{" "}
              <span className="font-semibold">{stats.responseTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
