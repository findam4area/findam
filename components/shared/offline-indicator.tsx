"use client";

import { useOffline } from "@/lib/hooks/useOffline";
import { WifiOff, Wifi, RefreshCw, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * OfflineIndicator Component
 * 
 * Displays a banner at the top of the page to indicate:
 * 1. When the user is offline (Requirement 17.3)
 * 2. When there are queued actions waiting to sync (Requirement 17.4)
 * 3. Provides ability to manually sync queued actions (Requirement 17.9)
 * 
 * Requirements: 17.3, 17.4, 17.9
 */
export function OfflineIndicator() {
  const { isOnline, queuedActions, syncOfflineQueue, clearQueue } =
    useOffline();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncOfflineQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/90 backdrop-blur-sm text-black px-4 py-2 shadow-lg"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="font-medium">You&apos;re offline</span>
              {queuedActions.length > 0 && (
                <span className="text-sm">
                  ({queuedActions.length} action
                  {queuedActions.length !== 1 ? "s" : ""} queued)
                </span>
              )}
            </div>
            {queuedActions.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearQueue}
                className="text-black hover:bg-black/10"
                aria-label="Clear queued actions"
              >
                <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
                Clear Queue
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {isOnline && queuedActions.length > 0 && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 shadow-lg"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="font-medium">Back online</span>
              <span className="text-sm">
                ({queuedActions.length} action
                {queuedActions.length !== 1 ? "s" : ""} pending sync)
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSync}
              disabled={isSyncing}
              className="text-white hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label={isSyncing ? "Syncing actions..." : "Sync queued actions now"}
            >
              <RefreshCw 
                className={`h-4 w-4 mr-1 ${isSyncing ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
