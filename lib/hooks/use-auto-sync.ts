/**
 * useAutoSync Hook
 * Automatically syncs offline actions when coming back online
 * Requirements: 18.9
 */

import { useEffect, useRef, useCallback } from "react";
import { pwaService } from "@/lib/services/pwa";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";

export interface AutoSyncOptions {
  enabled?: boolean;
  syncInterval?: number; // Interval in milliseconds
  onSyncStart?: () => void;
  onSyncComplete?: (result: {
    success: boolean;
    synced_count: number;
    failed_count: number;
  }) => void;
  onSyncError?: (error: Error) => void;
}

export function useAutoSync(options: AutoSyncOptions = {}) {
  const {
    enabled = true,
    syncInterval = 5 * 60 * 1000, // 5 minutes default
    onSyncStart,
    onSyncComplete,
    onSyncError,
  } = options;

  const { user } = useAuthStore();
  const syncingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const performSync = useCallback(async () => {
    if (!user || !enabled || syncingRef.current) return;

    // Check if online
    if (!navigator.onLine) return;

    syncingRef.current = true;
    onSyncStart?.();

    try {
      const result = await pwaService.syncOfflineActions(user.id);

      onSyncComplete?.(result);

      if (result.synced_count > 0) {
        toast.success(
          `Synced ${result.synced_count} offline action${
            result.synced_count !== 1 ? "s" : ""
          }`,
        );
      }

      if (result.failed_count > 0) {
        toast.error(
          `Failed to sync ${result.failed_count} action${
            result.failed_count !== 1 ? "s" : ""
          }`,
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Sync failed");
      onSyncError?.(err);
      console.error("Auto-sync failed:", error);
    } finally {
      syncingRef.current = false;
    }
  }, [user, enabled, onSyncStart, onSyncComplete, onSyncError]);

  useEffect(() => {
    if (!enabled || !user) return;

    // Sync immediately when coming online
    const handleOnline = () => {
      console.log("Network online - triggering auto-sync");
      performSync();
    };

    window.addEventListener("online", handleOnline);

    // Set up periodic sync
    if (syncInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (navigator.onLine) {
          performSync();
        }
      }, syncInterval);
    }

    // Initial sync if online
    if (navigator.onLine) {
      performSync();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, user, syncInterval, performSync]);

  return {
    performSync,
    isSyncing: syncingRef.current,
  };
}
