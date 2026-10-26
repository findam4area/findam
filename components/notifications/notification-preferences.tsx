"use client";

import { useState } from "react";
import { useNotificationPreferences } from "@/lib/hooks/useNotificationPreferences";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { NotificationPreferences } from "@/lib/types";
import {
  Bell,
  MessageCircle,
  Heart,
  CreditCard,
  Shield,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function NotificationPreferences() {
  const {
    preferences,
    isLoading,
    updatePreferences,
    requestNotificationPermission,
  } = useNotificationPreferences();

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<string | null>(
    null,
  );

  const handleToggle = async (
    key: keyof Omit<
      NotificationPreferences,
      "user_id" | "created_at" | "updated_at"
    >,
  ) => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      await updatePreferences({
        [key]: !preferences[key],
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error updating preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setBrowserPermission(permission);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-naija-green" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Failed to load preferences</p>
      </div>
    );
  }

  const preferenceItems = [
    {
      key: "new_listing" as const,
      icon: Bell,
      title: "New Listings",
      description: "Get notified when new listings match your interests",
      color: "text-blue-400",
    },
    {
      key: "new_message" as const,
      icon: MessageCircle,
      title: "Messages",
      description: "Get notified when you receive new messages",
      color: "text-purple-400",
    },
    {
      key: "listing_interactions" as const,
      icon: Heart,
      title: "Listing Interactions",
      description: "Get notified when someone likes or saves your listings",
      color: "text-pink-400",
    },
    {
      key: "payment_updates" as const,
      icon: CreditCard,
      title: "Payment Updates",
      description: "Get notified about boost expirations and premium renewals",
      color: "text-orange-400",
    },
    {
      key: "admin_updates" as const,
      icon: Shield,
      title: "Admin Updates",
      description:
        "Get notified about listing approvals, removals, and reviews",
      color: "text-green-400",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Browser Notifications */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          Browser Notifications
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Enable browser notifications to receive real-time alerts even when
          FindAm is not open
        </p>
        <Button
          onClick={handleRequestPermission}
          variant="neon"
          className="w-full sm:w-auto"
        >
          <Bell className="w-4 h-4 mr-2" />
          {browserPermission === "granted"
            ? "Notifications Enabled"
            : "Enable Browser Notifications"}
        </Button>
        {browserPermission === "denied" && (
          <p className="text-sm text-red-400 mt-2">
            Notifications are blocked. Please enable them in your browser
            settings.
          </p>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-dark-border">
          <h3 className="text-lg font-semibold text-white mb-1">
            Notification Preferences
          </h3>
          <p className="text-sm text-gray-400">
            Choose which notifications you want to receive
          </p>
        </div>

        <div className="divide-y divide-dark-border">
          {preferenceItems.map((item, index) => {
            const Icon = item.icon;
            const isEnabled = preferences[item.key];

            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 hover:bg-dark-bg/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                        isEnabled ? "bg-naija-green/20" : "bg-gray-500/20",
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          isEnabled ? item.color : "text-gray-500",
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <Label
                        htmlFor={item.key}
                        className="text-white font-medium cursor-pointer"
                      >
                        {item.title}
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    id={item.key}
                    onClick={() => handleToggle(item.key)}
                    disabled={isSaving}
                    aria-label={`Toggle ${item.title} notifications`}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-naija-green focus:ring-offset-2 focus:ring-offset-dark-bg",
                      isEnabled ? "bg-naija-green" : "bg-gray-600",
                      isSaving && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        isEnabled ? "translate-x-6" : "translate-x-1",
                      )}
                    />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Save Success Message */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 bg-naija-green text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
        >
          <Check className="w-5 h-5" />
          <span>Preferences saved!</span>
        </motion.div>
      )}
    </div>
  );
}
