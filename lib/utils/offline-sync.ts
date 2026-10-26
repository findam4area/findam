/**
 * Offline Sync Manager
 * Handles syncing queued actions when connectivity is restored
 */

import {
  getQueuedActions,
  removeQueuedAction,
  updateActionRetries,
  isOnline,
} from "./offline-storage";
import { toast } from "sonner";

export class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private isSyncing = false;
  private syncListeners: Array<(success: boolean) => void> = [];

  private constructor() {
    // Listen for online/offline events
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleOnline());
      window.addEventListener("offline", () => this.handleOffline());

      // Register background sync if supported
      if (
        "serviceWorker" in navigator &&
        "sync" in ServiceWorkerRegistration.prototype
      ) {
        this.registerBackgroundSync();
      }
    }
  }

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log("Connection restored, syncing queued actions...");
    toast.success("Connection restored", {
      description: "Syncing your offline actions...",
    });
    this.syncQueuedActions();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log("Connection lost, actions will be queued");
    toast.warning("You're offline", {
      description: "Your actions will be synced when connection is restored",
    });
  }

  /**
   * Register background sync
   */
  private async registerBackgroundSync(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("sync-offline-queue");
      console.log("Background sync registered");
    } catch (error) {
      console.error("Failed to register background sync:", error);
    }
  }

  /**
   * Sync all queued actions
   */
  async syncQueuedActions(): Promise<void> {
    if (this.isSyncing) {
      console.log("Sync already in progress");
      return;
    }

    if (!isOnline()) {
      console.log("Cannot sync while offline");
      return;
    }

    this.isSyncing = true;
    let successCount = 0;
    let failureCount = 0;

    try {
      const actions = await getQueuedActions();
      console.log(`Syncing ${actions.length} queued actions`);

      for (const action of actions) {
        try {
          // Parse body
          let body;
          try {
            body = JSON.parse(action.body);
          } catch {
            body = action.body;
          }

          // Make the request
          const response = await fetch(action.url, {
            method: action.method,
            headers: {
              ...action.headers,
              "Content-Type": "application/json",
            },
            body: action.method !== "GET" ? JSON.stringify(body) : undefined,
          });

          if (response.ok) {
            // Success - remove from queue
            await removeQueuedAction(action.id!);
            successCount++;
            console.log(`Successfully synced action ${action.id}`);
          } else {
            // Failed - update retry count
            if ((action.retries || 0) < 5) {
              await updateActionRetries(action.id!);
              failureCount++;
              console.warn(
                `Failed to sync action ${action.id}, will retry. Status: ${response.status}`,
              );
            } else {
              // Max retries reached - remove from queue
              await removeQueuedAction(action.id!);
              failureCount++;
              console.error(
                `Max retries reached for action ${action.id}, removing from queue`,
              );
            }
          }
        } catch (error) {
          // Network error - update retry count
          if ((action.retries || 0) < 5) {
            await updateActionRetries(action.id!);
            failureCount++;
            console.error(`Error syncing action ${action.id}:`, error);
          } else {
            // Max retries reached - remove from queue
            await removeQueuedAction(action.id!);
            failureCount++;
            console.error(
              `Max retries reached for action ${action.id}, removing from queue`,
            );
          }
        }
      }

      // Notify listeners
      const success = failureCount === 0;
      this.notifyListeners(success);

      // Show toast notification
      if (successCount > 0) {
        toast.success("Sync complete", {
          description: `${successCount} action${successCount > 1 ? "s" : ""} synced successfully`,
        });
      }

      if (failureCount > 0) {
        toast.error("Some actions failed to sync", {
          description: `${failureCount} action${failureCount > 1 ? "s" : ""} will be retried later`,
        });
      }
    } catch (error) {
      console.error("Failed to sync queued actions:", error);
      this.notifyListeners(false);
      toast.error("Sync failed", {
        description: "Failed to sync offline actions. Will retry later.",
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Add a sync listener
   */
  addSyncListener(listener: (success: boolean) => void): void {
    this.syncListeners.push(listener);
  }

  /**
   * Remove a sync listener
   */
  removeSyncListener(listener: (success: boolean) => void): void {
    this.syncListeners = this.syncListeners.filter((l) => l !== listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(success: boolean): void {
    this.syncListeners.forEach((listener) => {
      try {
        listener(success);
      } catch (error) {
        console.error("Error in sync listener:", error);
      }
    });
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Manually trigger sync
   */
  async triggerSync(): Promise<void> {
    if (!isOnline()) {
      toast.warning("You're offline", {
        description: "Cannot sync while offline",
      });
      return;
    }

    await this.syncQueuedActions();
  }
}

// Export singleton instance
export const offlineSyncManager = OfflineSyncManager.getInstance();

/**
 * Hook for components to use offline sync
 */
export function useOfflineSync() {
  const triggerSync = () => offlineSyncManager.triggerSync();
  const isSyncing = () => offlineSyncManager.isSyncInProgress();

  return {
    triggerSync,
    isSyncing,
    isOnline: isOnline(),
  };
}
