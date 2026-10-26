"use client";

import React, { useEffect, useState } from "react";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  ShoppingBag,
  Star,
} from "lucide-react";
import {
  gamificationService,
  LeaderboardEntry,
} from "@/lib/services/gamification";
import { toast } from "sonner";
import Image from "next/image";

interface LeaderboardProps {
  type?: "sellers" | "buyers" | "points";
  limit?: number;
  className?: string;
}

export function Leaderboard({
  type = "points",
  limit = 50,
  className = "",
}: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<
    "sellers" | "buyers" | "points"
  >(type);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await gamificationService.getLeaderboard(
          selectedType,
          limit,
        );
        setEntries(data);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        toast.error("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedType, limit]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 border-gray-300 dark:border-gray-600";
      case 3:
        return "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-300 dark:border-orange-700";
      default:
        return "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Type Selector */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => setSelectedType("points")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            selectedType === "points"
              ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <Star className="w-4 h-4" />
          <span className="font-medium">Top Points</span>
        </button>
        <button
          onClick={() => setSelectedType("sellers")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            selectedType === "sellers"
              ? "bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">Top Sellers</span>
        </button>
        <button
          onClick={() => setSelectedType("buyers")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            selectedType === "buyers"
              ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="font-medium">Top Buyers</span>
        </button>
      </div>

      {/* Leaderboard Header */}
      <div className="flex items-center gap-2 px-4">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {selectedType === "points" && "Top Contributors"}
          {selectedType === "sellers" && "Top Sellers"}
          {selectedType === "buyers" && "Top Buyers"}
        </h2>
      </div>

      {/* Leaderboard List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No leaderboard data yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${getRankBgColor(
                entry.rank,
              )}`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-12 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                {entry.avatar_url ? (
                  <Image
                    src={entry.avatar_url}
                    alt={entry.username}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                    {entry.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white truncate">
                  {entry.username}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Level {entry.level}
                </div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedType === "points" &&
                    entry.total_points.toLocaleString()}
                  {selectedType === "sellers" && entry.items_sold}
                  {selectedType === "buyers" && entry.items_purchased}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedType === "points" && "points"}
                  {selectedType === "sellers" && "sales"}
                  {selectedType === "buyers" && "purchases"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
