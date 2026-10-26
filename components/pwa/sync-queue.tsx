"use client";

/**
 * Sync Queue Component
 * Displays queued offline actions and sync status
 * Requirements: 18.9
 */

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { pwaService, type OfflineAction } from "@/lib/services/pwa";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SyncQueue() {
  const { user } = useAuthStore();
  const [actions, setActions] = useState<OfflineAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadActions();

    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      handleSync();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

  const loadActions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const pendingActions = await pwaService.getPendingActions(user.id);
      setActions(pendingActions);
    } catch (error) {
      console.error("Failed to load offline actions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!user || !isOnline) {
      toast.error("Cannot sync while offline");
      return;
    }

    setSyncing(true);

    try {
      const result = await pwaService.syncOfflineActions(user.id);

      if (result.success) {
        toast.success(
          `Successfully synced ${result.synced_count} action${
            result.synced_count !== 1 ? "s" : ""
          }`,
        );
      } else {
        toast.warning(
          `Synced ${result.synced_count} action${
            result.synced_count !== 1 ? "s" : ""
          }, ${result.failed_count} failed`,
        );
      }

      // Reload actions
      await loadActions();
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Failed to sync actions. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const getActionIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-gray-400" />;
      case "syncing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "synced":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActionLabel = (actionType: string): string => {
    const labels: Record<string, string> = {
      create_listing: "Create listing",
      update_listing: "Update listing",
      delete_listing: "Delete listing",
      send_message: "Send message",
      like_listing: "Like listing",
      unlike_listing: "Unlike listing",
      save_listing: "Save listing",
      unsave_listing: "Unsave listing",
      create_review: "Create review",
      update_profile: "Update profile",
      create_offer: "Create offer",
      accept_offer: "Accept offer",
      reject_offer: "Reject offer",
    };

    return labels[actionType] || actionType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="text-center p-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <p className="text-gray-600">All actions synced</p>
        <p className="text-sm text-gray-400 mt-1">No pending offline actions</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sync Queue</h3>
          <p className="text-sm text-gray-500">
            {actions.length} pending action{actions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing || !isOnline || !user}
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      {!isOnline && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-sm text-orange-800">
            You&apos;re offline. Actions will sync automatically when You&apos;re back
            online.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {actions.map((action) => (
          <div
            key={action.id}
            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            {getActionIcon(action.sync_status)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {getActionLabel(action.action_type)}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(action.created_at).toLocaleString()}
              </p>
              {action.error_message && (
                <p className="text-xs text-red-600 mt-1">
                  {action.error_message}
                </p>
              )}
            </div>
            {action.priority > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                Priority
              </span>
            )}
            {action.sync_attempts > 0 && (
              <span className="text-xs text-gray-500">
                {action.sync_attempts} attempt
                {action.sync_attempts !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
