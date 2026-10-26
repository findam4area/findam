/**
 * Hook for managing offline actions
 * Provides utilities for queuing actions when offline and syncing when online
 */

import { useState, useEffect, useCallback } from "react";
import {
  queueOfflineAction,
  getQueuedActions,
  isOnline,
} from "@/lib/utils/offline-storage";
import { offlineSyncManager } from "@/lib/utils/offline-sync";
import { toast } from "sonner";

export interface OfflineAction {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  retries?: number;
}

export function useOfflineActions() {
  const [online, setOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setOnline(isOnline());
    };

    updateOnlineStatus();

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Load queued actions count
  const loadQueuedCount = useCallback(async () => {
    try {
      const actions = await getQueuedActions();
      setQueuedCount(actions.length);
    } catch (error) {
      console.error("Failed to load queued actions count:", error);
    }
  }, []);

  // Load count on mount and when online status changes
  useEffect(() => {
    loadQueuedCount();
  }, [loadQueuedCount, online]);

  // Listen for sync events
  useEffect(() => {
    const handleSyncComplete = (success: boolean) => {
      setIsSyncing(false);
      loadQueuedCount();
    };

    offlineSyncManager.addSyncListener(handleSyncComplete);

    return () => {
      offlineSyncManager.removeSyncListener(handleSyncComplete);
    };
  }, [loadQueuedCount]);

  /**
   * Queue an action for offline sync
   */
  const queueAction = useCallback(
    async (
      url: string,
      method: string,
      headers: Record<string, string>,
      body: any,
    ): Promise<void> => {
      try {
        await queueOfflineAction(url, method, headers, body);
        await loadQueuedCount();
        toast.info("Action queued", {
          description: "This action will be synced when you're back online",
        });
      } catch (error) {
        console.error("Failed to queue action:", error);
        toast.error("Failed to queue action", {
          description: "Please try again",
        });
      }
    },
    [loadQueuedCount],
  );

  /**
   * Make a request that will be queued if offline
   */
  const makeRequest = useCallback(
    async <T = any>(
      url: string,
      options: RequestInit = {},
    ): Promise<T | null> => {
      // If online, make the request normally
      if (online) {
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return await response.json();
        } catch (error) {
          console.error("Request failed:", error);
          toast.error("Request failed", {
            description: "Please try again",
          });
          return null;
        }
      }

      // If offline, queue the action
      if (options.method && options.method !== "GET") {
        await queueAction(
          url,
          options.method,
          (options.headers as Record<string, string>) || {},
          options.body,
        );
        return null;
      }

      // For GET requests when offline, show a message
      toast.warning("You're offline", {
        description: "This action requires an internet connection",
      });
      return null;
    },
    [online, queueAction],
  );

  /**
   * Trigger manual sync
   */
  const triggerSync = useCallback(async () => {
    if (!online) {
      toast.warning("You're offline", {
        description: "Cannot sync while offline",
      });
      return;
    }

    setIsSyncing(true);
    await offlineSyncManager.triggerSync();
  }, [online]);

  return {
    online,
    queuedCount,
    isSyncing,
    queueAction,
    makeRequest,
    triggerSync,
    refreshQueuedCount: loadQueuedCount,
  };
}
