"use client";

import React, { useEffect, useState } from "react";
import {
  Trophy,
  Star,
  TrendingUp,
  Award,
  Zap,
  Target,
  Flame,
  Gift,
  Crown,
  Medal,
} from "lucide-react";
import {
  gamificationService,
  UserLevel,
  UserAchievement,
} from "@/lib/services/gamification";
import { toast } from "sonner";

interface GamificationDashboardProps {
  userId: string;
  className?: string;
}

export function GamificationDashboard({
  userId,
  className = "",
}: GamificationDashboardProps) {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [levelData, achievementsData] = await Promise.all([
          gamificationService.getUserLevel(userId),
          gamificationService.getUserAchievements(userId),
        ]);

        setUserLevel(levelData);
        setAchievements(achievementsData);
      } catch (error) {
        console.error("Failed to fetch gamification data:", error);
        toast.error("Failed to load gamification data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  if (!userLevel) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">
          No gamification data available
        </p>
      </div>
    );
  }

  const progressPercentage =
    (userLevel.current_points / userLevel.points_to_next_level) * 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Level Card */}
      <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Level {userLevel.level}</h2>
              <p className="text-white/80 text-sm">
                {userLevel.total_points.toLocaleString()} total points
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{userLevel.current_points}</div>
            <div className="text-white/80 text-sm">
              / {userLevel.points_to_next_level} to next level
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-white/80 text-center">
            {Math.round(progressPercentage)}% to Level {userLevel.level + 1}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Current Streak"
          value={`${userLevel.current_streak_days} days`}
          color="text-orange-500"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Listings Posted"
          value={userLevel.listings_posted}
          color="text-blue-500"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Items Sold"
          value={userLevel.items_sold}
          color="text-green-500"
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          label="Achievements"
          value={achievements.length}
          color="text-purple-500"
        />
      </div>

      {/* Unlocked Perks */}
      {userLevel.unlocked_perks && userLevel.unlocked_perks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Unlocked Perks
            </h3>
          </div>
          <div className="space-y-2">
            {userLevel.unlocked_perks.map((perk) => (
              <div
                key={perk}
                className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
              >
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {formatPerkName(perk)}
                </span>
              </div>
            ))}
          </div>
          {userLevel.free_boosts_remaining > 0 && (
            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {userLevel.free_boosts_remaining} free boost
                  {userLevel.free_boosts_remaining !== 1 ? "s" : ""} available
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Achievements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Achievements
          </h3>
        </div>
        {achievements.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
            No achievements yet. Keep engaging to earn badges!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.slice(0, 8).map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
      <div className={`${color} mb-2`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function AchievementBadge({ achievement }: { achievement: UserAchievement }) {
  const rarityColors = {
    common: "from-gray-400 to-gray-500",
    rare: "from-blue-400 to-blue-600",
    epic: "from-purple-400 to-purple-600",
    legendary: "from-yellow-400 to-orange-500",
  };

  const rarity = achievement.achievement?.rarity || "common";
  const gradientClass = rarityColors[rarity];

  return (
    <div className="group relative">
      <div
        className={`bg-gradient-to-br ${gradientClass} rounded-xl p-4 text-white shadow-lg hover:scale-105 transition-transform cursor-pointer`}
      >
        <div className="flex flex-col items-center text-center">
          <Medal className="w-8 h-8 mb-2" />
          <div className="text-xs font-medium line-clamp-2">
            {achievement.achievement?.name || "Achievement"}
          </div>
        </div>
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {achievement.achievement?.description}
      </div>
    </div>
  );
}

function formatPerkName(perk: string): string {
  return perk
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
