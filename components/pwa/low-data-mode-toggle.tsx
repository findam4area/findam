"use client";

/**
 * Low Data Mode Toggle Component
 * Allows users to enable/disable low-data mode to reduce data usage
 * Requirements: 18.1
 */

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { pwaService } from "@/lib/services/pwa";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";

export function LowDataModeToggle() {
  const { user } = useAuthStore();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [dataUsage, setDataUsage] = useState<number>(0);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const settings = await pwaService.getSettings(user.id);
      if (settings) {
        setEnabled(settings.low_data_mode);
        setDataUsage(settings.data_usage_mb);
      }
    } catch (error) {
      console.error("Failed to load PWA settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!user) {
      toast.error("Please sign in to use this feature");
      return;
    }

    setToggling(true);

    try {
      await pwaService.toggleLowDataMode(user.id, checked);
      setEnabled(checked);
      toast.success(
        checked
          ? "Low-data mode enabled. Images will be compressed and videos won&apos;t auto-play."
          : "Low-data mode disabled. Full quality media will be loaded.",
      );
    } catch (error) {
      console.error("Failed to toggle low-data mode:", error);
      toast.error("Failed to update settings. Please try again.");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          {enabled ? (
            <WifiOff className="h-5 w-5 text-orange-500" />
          ) : (
            <Wifi className="h-5 w-5 text-green-500" />
          )}
          <div className="flex-1">
            <Label
              htmlFor="low-data-mode"
              className="text-base font-medium cursor-pointer"
            >
              Low-Data Mode
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              {enabled
                ? "Saving data by compressing images and disabling video auto-play"
                : "Full quality media is being loaded"}
            </p>
          </div>
        </div>
        <Switch
          id="low-data-mode"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={toggling || !user}
          aria-label="Toggle low-data mode"
        />
      </div>

      {user && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Data usage this month</span>
            <span className="text-sm font-medium">
              {dataUsage.toFixed(2)} MB
            </span>
          </div>
          {enabled && (
            <p className="text-xs text-gray-500 mt-2">
              Low-data mode can reduce data usage by up to 70%
            </p>
          )}
        </div>
      )}

      {enabled && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            What's different in low-data mode?
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Images compressed to 50% quality</li>
            <li>• Lower resolution images loaded</li>
            <li>• Videos don&apos;t auto-play</li>
            <li>• Thumbnails shown instead of full videos</li>
          </ul>
        </div>
      )}
    </div>
  );
}
