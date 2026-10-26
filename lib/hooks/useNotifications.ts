"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/lib/api/notifications";
import {
  subscribeToNotifications,
  unsubscribeChannel,
} from "@/lib/supabase/realtime";
import type { Notification } from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial notifications
  const fetchNotifications = useCallback(
    async (options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    }) => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await getNotifications(user.id, options);
        setNotifications(data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const count = await getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [user]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
      throw err;
    }
  }, []);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      throw err;
    }
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    let channel: RealtimeChannel | null = null;

    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    // Subscribe to new notifications
    channel = subscribeToNotifications(user.id, (notification) => {
      // Add new notification to the list
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if permission granted
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(notification.title, {
            body: notification.message,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
          });
        }
      }
    });

    return () => {
      if (channel) {
        unsubscribeChannel(channel);
      }
    };
  }, [user, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
  };
}
