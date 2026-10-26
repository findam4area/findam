"use client";

import { useOfflineActions } from "@/lib/hooks/useOfflineActions";
import { WifiOff, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineIndicator() {
  const { online, queuedCount, isSyncing, triggerSync } = useOfflineActions();

  // Don&apos;t show anything if online and no queued actions
  if (online && queuedCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 md:bottom-4"
      >
        <div className="bg-background/95 backdrop-blur-lg border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-3">
          {!online ? (
            <>
              <WifiOff className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">You&apos;re offline</span>
              {queuedCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {queuedCount} action{queuedCount > 1 ? "s" : ""} queued
                </span>
              )}
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 text-primary animate-spin" />
              <span className="text-sm font-medium">Syncing...</span>
            </>
          ) : queuedCount > 0 ? (
            <>
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {queuedCount} action{queuedCount > 1 ? "s" : ""} pending
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={triggerSync}
                className="h-6 px-2 text-xs"
              >
                Sync now
              </Button>
            </>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
