"use client";

import { useNotifications } from "@/lib/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { Button } from "@/components/ui/button";
import { Check, Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NotificationsPage() {
  const { notifications, isLoading, markAllAsRead, fetchNotifications } =
    useNotifications();

  const handleRefresh = async () => {
    await fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/feed"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Notifications</h1>
              <p className="text-gray-400 mt-2">
                Stay updated with your activity
              </p>
            </div>

            <Link href="/notifications/preferences">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>

          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="mt-4 text-naija-green hover:text-naija-green hover:bg-naija-green/10"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-naija-green" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-gray-400">
                <div className="w-20 h-20 rounded-full bg-dark-bg flex items-center justify-center mb-4">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  you're all caught up!
                </h3>
                <p className="text-center">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-border">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <NotificationItem notification={notification} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}
