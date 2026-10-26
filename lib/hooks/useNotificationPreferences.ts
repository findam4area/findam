"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/api/notifications";
import type { NotificationPreferences } from "@/lib/types";

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getNotificationPreferences(user.id);

      // Set default preferences if none exist
      if (!data) {
        setPreferences({
          user_id: user.id,
          new_listing: true,
          new_message: true,
          listing_interactions: true,
          payment_updates: true,
          admin_updates: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        setPreferences(data);
      }
    } catch (err) {
      console.error("Error fetching notification preferences:", err);
      setError("Failed to load preferences");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update preferences
  const updatePreferences = useCallback(
    async (
      updates: Partial<
        Omit<NotificationPreferences, "user_id" | "created_at" | "updated_at">
      >,
    ) => {
      if (!user) return;

      try {
        setError(null);
        const updated = await updateNotificationPreferences(user.id, updates);
        setPreferences(updated);
      } catch (err) {
        console.error("Error updating notification preferences:", err);
        setError("Failed to update preferences");
        throw err;
      }
    },
    [user],
  );

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    requestNotificationPermission,
    refetch: fetchPreferences,
  };
}
