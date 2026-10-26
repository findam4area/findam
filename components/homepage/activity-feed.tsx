"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ShoppingBag, UserPlus, Star, Package, AlertCircle } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getSafeImageUrl } from "@/lib/utils/image-url";
import { createClient } from "@/lib/supabase/client";
import type { ActivityFeedProps, Activity } from "./types";

/**
 * ActivityFeed Component
 * 
 * Real-time display of platform activity using Supabase realtime subscriptions.
 * 
 * Requirements:
 * - 5.1: Display recent 10-20 activities with timestamps and avatars
 * - 5.2: Subscribe to Supabase realtime channel for activities
 * - 5.3: Display activity items with timestamps, user avatars, and descriptions
 * - 5.4: Implement slide-in animation for new activities
 * - 5.5: Handle connection errors with fallback to polling
 * - 5.6: Anonymize sensitive user information
 * - 5.7: Display activity icons matching action type
 * - 5.8: Dismissible/collapsible on mobile devices
 */

const activityIcons = {
  listing: Package,
  purchase: ShoppingBag,
  registration: UserPlus,
  review: Star,
};

const activityColors = {
  listing: "text-neon-cyan",
  purchase: "text-naija-green",
  registration: "text-neon-purple",
  review: "text-yellow-500",
};

interface ActivityItemProps {
  activity: Activity;
  isNew?: boolean;
}

function ActivityItem({ activity, isNew = false }: ActivityItemProps) {
  const Icon = activityIcons[activity.type];
  const iconColor = activityColors[activity.type];

  return (
    <motion.div
      // Slide-in animation for new activities (Requirement 5.4)
      initial={isNew ? { opacity: 0, y: -20 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-dark-card/50 transition-colors"
      role="article"
      aria-label={`${activity.type} activity from ${activity.user.name}`}
    >
      {/* Activity Icon (Requirement 5.7) */}
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          activity.type === "listing" && "bg-neon-cyan/10",
          activity.type === "purchase" && "bg-naija-green/10",
          activity.type === "registration" && "bg-neon-purple/10",
          activity.type === "review" && "bg-yellow-500/10"
        )}
        aria-label={`${activity.type} activity icon`}
      >
        <Icon className={cn("h-5 w-5", iconColor)} aria-hidden="true" />
      </div>

      {/* Activity Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {/* User Avatar (Requirement 5.3) */}
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
            safeAvatarUrl = getSafeImageUrl(activity.user.avatar, undefined, activity.user.name);
            const safeAvatarUrl = getSafeImageUrl(activity.user.avatar, undefined, activity.user.name);
            <Image
              src={safeAvatarUrl}
              alt={activity.user.name}
              fill
              className="object-cover"
              sizes="32px"
            />
          </div>

          {/* Description and Timestamp */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-300 leading-relaxed">
              <span className="font-semibold text-white">
                {activity.user.name}
              </span>{" "}
              {activity.description}
            </p>
            {/* Timestamp (Requirement 5.3) */}
            <p className="text-xs text-gray-500 mt-1">
              {formatRelativeTime(activity.timestamp)}
            </p>
          </div>
        </div>
      </div>

      {/* New indicator */}
      {isNew && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-naija-green animate-pulse" />
        </div>
      )}
    </motion.div>
  );
}

export function ActivityFeed({
  initialActivities = [],
  className = "",
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "connecting" | "error"
  >("connecting");
  const [newActivityIds, setNewActivityIds] = useState<Set<string>>(new Set());
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback polling function (Requirement 5.5)
  const pollActivities = async () => {
    try {
      const response = await fetch("/api/activities/recent");
      if (response.ok) {
        const data = await response.json();
        setActivities((prev) => {
          const newActivities = data.filter(
            (activity: Activity) => !prev.some((a) => a.id === activity.id)
          );
          if (newActivities.length > 0) {
            const newIds = new Set<string>(newActivities.map((a: Activity) => a.id));
            setNewActivityIds(newIds);
            setTimeout(() => setNewActivityIds(new Set<string>()), 3000);
          }
          return [...newActivities, ...prev].slice(0, 20);
        });
      }
    } catch (error) {
      console.error("Failed to poll activities:", error);
    }
  };

  // Setup realtime subscription (Requirement 5.2)
  useEffect(() => {
    // Create realtime channel
    const channel = supabase
      .channel("activities")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activities",
        },
        (payload) => {
          const newActivity = payload.new as Activity;
          
          // Add to activities list (Requirement 5.1 - limit to 20)
          setActivities((prev) => {
            // Mark as new for animation
            setNewActivityIds((ids) => new Set(ids).add(newActivity.id));
            setTimeout(() => {
              setNewActivityIds((ids) => {
                const newIds = new Set(ids);
                newIds.delete(newActivity.id);
                return newIds;
              });
            }, 3000);

            return [newActivity, ...prev].slice(0, 20);
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
          // Clear polling if it was running
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionStatus("error");
          // Fallback to polling (Requirement 5.5)
          if (!pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(pollActivities, 30000);
          }
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [supabase]);

  return (
    <section 
      className={cn("py-12", className)}
      aria-labelledby="activity-feed-heading"
      role="region"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 id="activity-feed-heading" className="text-2xl font-bold text-white mb-1">
                Live Activity
              </h2>
              <p className="text-sm text-gray-400">
                See what&apos;s happening on the platform
              </p>
            </div>

            {/* Collapse button for mobile (Requirement 5.8) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsCollapsed(!isCollapsed);
                }
              }}
              className="lg:hidden px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-lg min-h-[44px] min-w-[44px]"
              aria-label={isCollapsed ? "Expand activity feed" : "Collapse activity feed"}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? "Show" : "Hide"}
            </button>
          </div>

          {/* Connection Status Indicator */}
          {connectionStatus === "error" && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2 text-sm text-yellow-500">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                Real-time updates unavailable. Showing cached activities.
              </span>
            </div>
          )}

          {/* Activity List */}
          <AnimatePresence mode="popLayout">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-dark-card/30 backdrop-blur-sm border border-dark-border rounded-xl overflow-hidden"
                aria-live="polite"
                aria-atomic="false"
                aria-relevant="additions"
              >
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar" role="feed" aria-busy={connectionStatus === "connecting"}>
                  {activities.length > 0 ? (
                    <div className="divide-y divide-dark-border/50">
                      {activities.map((activity) => (
                        <ActivityItem
                          key={activity.id}
                          activity={activity}
                          isNew={newActivityIds.has(activity.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connection Status Badge */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                connectionStatus === "connected" && "bg-naija-green",
                connectionStatus === "connecting" && "bg-yellow-500 animate-pulse",
                connectionStatus === "error" && "bg-red-500"
              )}
            />
            <span>
              {connectionStatus === "connected" && "Live updates active"}
              {connectionStatus === "connecting" && "Connecting..."}
              {connectionStatus === "error" && "Using fallback mode"}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.5);
        }
      `}</style>
    </section>
  );
}
