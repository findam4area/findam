"use client";

import { useNotifications } from "@/lib/hooks/useNotifications";
import { NotificationItem } from "./notification-item";
import { Button } from "@/components/ui/button";
import { Check, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, isLoading, markAllAsRead } = useNotifications();

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <div className="w-[400px] max-w-[calc(100vw-2rem)] bg-dark-card border border-dark-border rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-dark-border bg-dark-bg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">Notifications</h3>
          <Link
            href="/notifications/preferences"
            onClick={onClose}
            className="p-2 hover:bg-dark-card rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-400 hover:text-white" />
          </Link>
        </div>

        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="w-full text-naija-green hover:text-naija-green hover:bg-naija-green/10"
          >
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-naija-green" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-dark-bg flex items-center justify-center mb-4">
              <Check className="w-8 h-8" />
            </div>
            <p className="text-center">you're all caught up!</p>
            <p className="text-sm text-center mt-1">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {notifications.slice(0, 10).map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NotificationItem
                  notification={notification}
                  onClose={onClose}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 10 && (
        <div className="p-3 border-t border-dark-border bg-dark-bg">
          <Link
            href="/notifications"
            onClick={onClose}
            className="block text-center text-sm text-naija-green hover:text-neon-cyan transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
