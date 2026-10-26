"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { offlineSyncManager } from "@/lib/utils/offline-sync";
import { cleanupOldCache } from "@/lib/utils/offline-storage";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      registerServiceWorker();
    }

    // Initialize offline sync manager
    initializeOfflineSync();

    // Cleanup old cache on mount
    cleanupOldCache();
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("Service Worker registered:", registration);

      // Check for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available
              toast.info("New version available! Refresh to update.", {
                duration: 10000,
                action: {
                  label: "Refresh",
                  onClick: () => {
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                    window.location.reload();
                  },
                },
              });
            }
          });
        }
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SYNC_SUCCESS") {
          console.log("Sync successful:", event.data.request);
        }
      });
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  };

  const initializeOfflineSync = () => {
    // The singleton instance is already created, just trigger initial sync if online
    if (navigator.onLine) {
      offlineSyncManager.syncQueuedActions();
    }
  };

  return null;
}
