/**
 * Boost Performance Analytics Component
 * Displays performance metrics for boosted listings
 * Requirements: 14.8
 * Task: 34.9
 */

"use client";

import { useEffect, useState } from "react";
import { Eye, TrendingUp, MessageCircle, Zap, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Boost, BoostPerformance } from "@/lib/types";

interface BoostPerformanceAnalyticsProps {
  listingId: string;
}

interface BoostWithPerformance extends Boost {
  performance: BoostPerformance;
}

export function BoostPerformanceAnalytics({
  listingId,
}: BoostPerformanceAnalyticsProps) {
  const [boosts, setBoosts] = useState<BoostWithPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBoostData();
  }, [listingId]);

  const fetchBoostData = async () => {
    try {
      const response = await fetch(`/api/boosts/${listingId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch boost data");
      }

      const data = await response.json();
      setBoosts(data.active_boosts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }

    return `${hours}h ${minutes}m remaining`;
  };

  const calculateProgress = (startedAt: string, expiresAt: string) => {
    const start = new Date(startedAt).getTime();
    const end = new Date(expiresAt).getTime();
    const now = Date.now();

    const total = end - start;
    const elapsed = now - start;

    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">Loading boost data...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (boosts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Zap className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>No active boosts for this listing</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {boosts.map((boost) => {
        const timeRemaining = calculateTimeRemaining(boost.expires_at);
        const progress = calculateProgress(boost.started_at, boost.expires_at);

        return (
          <Card key={boost.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Active Boost
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {boost.package_type.charAt(0).toUpperCase() +
                    boost.package_type.slice(1)}{" "}
                  Package
                </span>
              </div>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {timeRemaining}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Time Progress</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                    <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {boost.performance.views_gained}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Views Gained
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {boost.performance.impressions_gained}
                    </p>
                    <p className="text-xs text-muted-foreground">Impressions</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                    <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {boost.performance.messages_received}
                    </p>
                    <p className="text-xs text-muted-foreground">Messages</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">Boost Details</p>
                <div className="mt-2 grid gap-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span>
                      {new Date(boost.started_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span>
                      {new Date(boost.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{boost.duration_hours} hours</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
