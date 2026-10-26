"use client";

/**
 * MatchFeed Component
 * Displays all new matches across all saved searches
 * Requirements: 13.10
 * Task: 42.13
 */

import { useState, useEffect } from "react";
import { Bell, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { SearchAlert } from "@/lib/services/alert";
import Link from "next/link";
import Image from "next/image";

interface MatchFeedProps {
  userId: string;
}

export function MatchFeed({ userId }: MatchFeedProps) {
  const [alerts, setAlerts] = useState<SearchAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new_listing" | "price_drop">(
    "all",
  );
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [userId, filter, unreadOnly]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: "50",
        offset: "0",
      });

      if (unreadOnly) {
        params.append("unreadOnly", "true");
      }

      const response = await fetch(`/api/alerts?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to load alerts");

      const data = await response.json();
      let filteredAlerts = data.alerts || [];

      if (filter !== "all") {
        filteredAlerts = filteredAlerts.filter(
          (alert: SearchAlert) => alert.alert_type === filter,
        );
      }

      setAlerts(filteredAlerts);
    } catch (error) {
      console.error("Error loading alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/read`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to mark as read");

      // Update local state
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, is_read: true } : alert,
        ),
      );
    } catch (error) {
      console.error("Error marking alert as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const unreadCount = alerts.filter((alert) => !alert.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Match Feed
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} new</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            New listings and price drops from your saved searches
          </p>
        </div>
        <Button
          variant={unreadOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setUnreadOnly(!unreadOnly)}
        >
          <Bell className="h-4 w-4 mr-2" />
          {unreadOnly ? "Show All" : "Unread Only"}
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="new_listing">New Listings</TabsTrigger>
          <TabsTrigger value="price_drop">Price Drops</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
            <p className="text-sm text-muted-foreground text-center">
              {unreadOnly
                ? "You've read all your alerts"
                : "We'll notify you when new listings match your saved searches"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`transition-all hover:shadow-md ${
                    !alert.is_read ? "border-l-4 border-l-primary" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Listing Image */}
                      {alert.listing_snapshot?.imageUrl && (
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                          <Image
                            src={alert.listing_snapshot.imageUrl}
                            alt={alert.listing_snapshot.title || "Listing"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Alert Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <Badge
                              variant={
                                alert.alert_type === "price_drop"
                                  ? "destructive"
                                  : "default"
                              }
                              className="mb-2"
                            >
                              {alert.alert_type === "price_drop"
                                ? `${alert.price_drop_percentage}% Price Drop`
                                : "New Match"}
                            </Badge>
                            <h3 className="font-semibold text-sm line-clamp-2">
                              {alert.listing_snapshot?.title || "Listing"}
                            </h3>
                          </div>
                          {!alert.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(alert.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Price Information */}
                        <div className="flex items-center gap-2 mb-2">
                          {alert.alert_type === "price_drop" &&
                          alert.previous_price ? (
                            <>
                              <span className="text-sm text-muted-foreground line-through">
                                ₦{alert.previous_price.toLocaleString()}
                              </span>
                              <span className="text-lg font-bold text-green-600">
                                ₦{alert.new_price?.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold">
                              ₦{alert.listing_snapshot?.price?.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(alert.sent_at)}
                          </span>
                          <Link href={`/listing/${alert.listing_id}`}>
                            <Button size="sm" variant="outline">
                              View Listing
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
