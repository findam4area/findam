"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  openDB,
  queueOfflineAction,
  getQueuedActions,
  removeQueuedAction,
  clearQueuedActions,
} from "@/lib/utils/offline-storage";

interface OfflineQueueItem {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedActions, setQueuedActions] = useState<OfflineQueueItem[]>([]);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online! Syncing queued actions...");
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline. Actions will be queued for sync.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for service worker messages
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSWMessage);
    }

    // Load queued actions on mount
    loadQueuedActions();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
      }
    };
  }, []);

  const handleSWMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === "SYNC_SUCCESS") {
      toast.success("Synced offline action successfully");
      loadQueuedActions();
    }
  };

  const loadQueuedActions = async () => {
    try {
      const actions = await getQueuedActions();
      setQueuedActions(actions);
    } catch (error) {
      console.error("Failed to load queued actions:", error);
    }
  };

  const syncOfflineQueue = async () => {
    // Check if background sync is available
    const hasBackgroundSync =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      typeof navigator.serviceWorker.ready !== "undefined";

    if (hasBackgroundSync) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Check if sync is available on the registration
        if ("sync" in registration) {
          await registration.sync.register("sync-offline-queue");
          return;
        }
      } catch (error) {
        console.error("Background sync registration failed:", error);
      }
    }

    // Fallback: manually sync
    await manualSync();
  };

  const manualSync = async () => {
    try {
      const requests = await getQueuedActions();

      for (const requestData of requests) {
        try {
          const response = await fetch(requestData.url, {
            method: requestData.method,
            headers: requestData.headers,
            body: requestData.body,
          });

          if (response.ok && requestData.id) {
            // Remove from queue
            await removeQueuedAction(requestData.id);
            toast.success("Synced offline action");
          }
        } catch (error) {
          console.error("Failed to sync request:", error);
        }
      }

      await loadQueuedActions();
    } catch (error) {
      console.error("Manual sync failed:", error);
    }
  };

  const queueAction = async (
    url: string,
    method: string,
    body?: any,
    headers?: Record<string, string>,
  ) => {
    try {
      await queueOfflineAction(
        url,
        method,
        headers || { "Content-Type": "application/json" },
        JSON.stringify(body),
      );
      await loadQueuedActions();
      toast.info("Action queued for sync when online");
    } catch (error) {
      console.error("Failed to queue action:", error);
      toast.error("Failed to queue action");
    }
  };

  const clearQueue = async () => {
    try {
      await clearQueuedActions();
      setQueuedActions([]);
      toast.success("Offline queue cleared");
    } catch (error) {
      console.error("Failed to clear queue:", error);
    }
  };

  return {
    isOnline,
    queuedActions,
    queueAction,
    syncOfflineQueue,
    clearQueue,
  };
}
