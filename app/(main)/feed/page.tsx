"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import {
  DynamicFeedContainer,
  DynamicTrendingCarousel,
} from "@/lib/utils/dynamic-imports";
import { RecommendedForYou } from "@/components/feed/recommended-for-you";
import { getListings } from "@/lib/api/listings";
import type { Listing } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FeedPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [trendingListings, setTrendingListings] = useState<Listing[]>([]);

  // Load trending listings (most viewed/liked) - public access
  useEffect(() => {
    const loadTrending = async () => {
      try {
        const result = await getListings({ sort_by: "date_desc" }, 0, 5);
        setTrendingListings(result.data);
      } catch (error) {
        console.error("Failed to load trending listings:", error);
      }
    };

    loadTrending();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-naija-green" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-naija-green to-neon-cyan bg-clip-text text-transparent">
            Discover
          </h1>
          {!user && (
            <Link href="/login">
              <Button variant="neon" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Guest Banner */}
        {!user && (
          <div className="bg-gradient-to-r from-naija-green/10 to-neon-cyan/10 border border-naija-green/30 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-white font-semibold mb-1">
                  Browsing as Guest
                </h3>
                <p className="text-gray-400 text-sm">
                  Sign in to post listings, message sellers, and save favorites
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/register">
                  <Button variant="neon" size="sm">
                    Create Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Trending Carousel */}
        {trendingListings.length > 0 && (
          <DynamicTrendingCarousel
            listings={trendingListings}
            className="glass-card border border-dark-border"
          />
        )}

        {/* Recommended for You Section - Requirement 7.3, 7.6 */}
        {user && <RecommendedForYou className="mb-6" limit={20} />}

        {/* Feed */}
        <DynamicFeedContainer />
      </div>
    </div>
  );
}
