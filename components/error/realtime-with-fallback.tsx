"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PollingFallback, addBreadcrumb } from "@/lib/errors";
import { WifiOff, Wifi } from "lucide-react";

interface RealtimeWithFallbackProps<T> {
  /**
   * Function to subscribe to realtime updates
   * Should return an unsubscribe function
   */
  subscribeToRealtime: (onUpdate: (data: T) => void) => () => void;

  /**
   * Function to fetch data via polling
   */
  pollData: () => Promise<T>;

  /**
   * Polling interval in milliseconds (default: 30000 = 30 seconds)
   */
  pollingInterval?: number;

  /**
   * Callback when data is received
   */
  onData: (data: T) => void;

  /**
   * Callback when connection status changes
   */
  onConnectionChange?: (isConnected: boolean) => void;

  /**
   * Show connection status indicator
   */
  showStatus?: boolean;

  /**
   * Children to render
   */
  children?: React.ReactNode;
}

/**
 * Component that handles realtime subscriptions with automatic polling fallback
 * Implements Requirement 19.3: Fall back to polling when realtime fails
 */
export function RealtimeWithFallback<T>({
  subscribeToRealtime,
  pollData,
  pollingInterval = 30000,
  onData,
  onConnectionChange,
  showStatus = false,
  children,
}: RealtimeWithFallbackProps<T>) {
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const pollingFallbackRef = useRef<PollingFallback | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const startPolling = useCallback(() => {
    if (pollingFallbackRef.current?.isActive()) return;

    addBreadcrumb({
      message: "Starting polling fallback for realtime connection",
      category: "fallback",
      level: "warning",
    });

    pollingFallbackRef.current = new PollingFallback(async () => {
      try {
        const data = await pollData();
        onData(data);
      } catch (error) {
        console.warn("Polling error:", error);
      }
    }, pollingInterval);

    pollingFallbackRef.current.start();
    setIsRealtimeConnected(false);
    onConnectionChange?.(false);
  }, [pollData, pollingInterval, onData, onConnectionChange]);

  const stopPolling = useCallback(() => {
    if (pollingFallbackRef.current) {
      pollingFallbackRef.current.stop();
      pollingFallbackRef.current = null;
    }
  }, []);

  const attemptRealtimeConnection = useCallback(() => {
    try {
      // Clean up existing subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      // Stop polling if active
      stopPolling();

      // Subscribe to realtime updates
      const unsubscribe = subscribeToRealtime((data) => {
        onData(data);
        setIsRealtimeConnected(true);
        setConnectionAttempts(0);
        onConnectionChange?.(true);
      });

      unsubscribeRef.current = unsubscribe;

      addBreadcrumb({
        message: "Realtime connection established",
        category: "connection",
      });
    } catch (error) {
      console.error("Failed to establish realtime connection:", error);
      setConnectionAttempts((prev) => prev + 1);

      // After 3 failed attempts, fall back to polling
      if (connectionAttempts >= 2) {
        startPolling();
      } else {
        // Retry after a delay
        setTimeout(attemptRealtimeConnection, 5000);
      }
    }
  }, [
    subscribeToRealtime,
    onData,
    onConnectionChange,
    stopPolling,
    startPolling,
    connectionAttempts,
  ]);

  useEffect(() => {
    attemptRealtimeConnection();

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      stopPolling();
    };
  }, [attemptRealtimeConnection, stopPolling]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      addBreadcrumb({
        message: "Network connection restored",
        category: "connection",
      });
      attemptRealtimeConnection();
    };

    const handleOffline = () => {
      addBreadcrumb({
        message: "Network connection lost",
        category: "connection",
        level: "warning",
      });
      startPolling();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [attemptRealtimeConnection, startPolling]);

  if (!showStatus) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {children}
      {!isRealtimeConnected && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-lg px-4 py-2 flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-yellow-500">
              Using polling mode
            </span>
          </div>
        </div>
      )}
      {isRealtimeConnected && connectionAttempts > 0 && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-lg px-4 py-2 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-500">
              Realtime connected
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
