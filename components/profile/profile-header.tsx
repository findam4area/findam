"use client";

import Image from "next/image";
import { MapPin, Calendar, Star } from "lucide-react";
import { TrustScore } from "./trust-score";
import { VerificationBadge } from "@/components/verification";
import { PremiumBadge } from "@/components/subscription";
import { useSellerBadge } from "@/lib/hooks/useSellerBadge";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProfileHeaderProps {
  user: User;
  listingsCount: number;
  averageRating: number;
  reviewsCount: number;
  isOwnProfile?: boolean;
  className?: string;
}

export function ProfileHeader({
  user,
  listingsCount,
  averageRating,
  reviewsCount,
  isOwnProfile = false,
  className,
}: ProfileHeaderProps) {
  // Fetch seller badge (Requirements: 15.1, 15.8)
  const { badge } = useSellerBadge(user.id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <motion.div
      className={cn(
        "glass-card relative overflow-hidden rounded-2xl border border-dark-border p-6",
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-naija-green/10 via-transparent to-neon-cyan/10" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start">
        {/* Avatar and Trust Score */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-naija-green/50 md:h-32 md:w-32">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.username}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-naija-green to-neon-cyan text-2xl font-bold text-white md:text-3xl">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <TrustScore score={user.trust_score} size="md" />
        </div>

        {/* User Info */}
        <div className="flex-1 space-y-4">
          {/* Username and Badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                {user.username}
              </h1>
              {/* Verification Badge - Requirements: 15.1, 15.8 */}
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
              {/* Premium Badge - Requirements: 24.4 */}
              {user.is_premium && user.premium_tier && (
                <PremiumBadge plan={user.premium_tier} size="sm" />
              )}
            </div>

            {user.bio && (
              <p className="text-sm text-gray-300 md:text-base">{user.bio}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-naija-green/20">
                <span className="text-lg">📦</span>
              </div>
              <div>
                <p className="font-semibold text-white">{listingsCount}</p>
                <p className="text-xs text-gray-400">Active Listings</p>
              </div>
            </div>

            {reviewsCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400/20">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {averageRating.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {reviewsCount} {reviewsCount === 1 ? "Review" : "Reviews"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon-cyan/20">
                <Calendar className="h-4 w-4 text-neon-cyan" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Joined</p>
                <p className="font-semibold text-white">
                  {formatDate(user.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info (only for own profile or if phone is verified) */}
          {(isOwnProfile || user.phone_verified) && user.phone && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300">{user.phone}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
