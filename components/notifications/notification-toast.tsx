"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  MessageCircle,
  Heart,
  Bookmark,
  TrendingUp,
  CreditCard,
  Star,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import type { Notification, NotificationType } from "@/lib/types";
import Link from "next/link";

/**
 * Component that listens for new notifications and displays toast messages
 * Should be mounted once at the app level
 */
export function NotificationToast() {
  const { notifications } = useNotifications();
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([]);

  useEffect(() => {
    // Only show toast for the most recent unread notification
    if (notifications.length > 0) {
      const latestNotification = notifications[0];

      if (!latestNotification.is_read) {
        // Check if this notification is already visible
        const isAlreadyVisible = visibleToasts.some(
          (toast) => toast.id === latestNotification.id,
        );

        if (!isAlreadyVisible) {
          setVisibleToasts((prev) => [latestNotification, ...prev].slice(0, 3));

          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            setVisibleToasts((prev) =>
              prev.filter((toast) => toast.id !== latestNotification.id),
            );
          }, 5000);
        }
      }
    }
  }, [notifications, visibleToasts]);

  const handleDismiss = (id: string) => {
    setVisibleToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {visibleToasts.map((notification) => (
          <ToastItem
            key={notification.id}
            notification={notification}
            onDismiss={() => handleDismiss(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  notification: Notification;
  onDismiss: () => void;
}

function ToastItem({ notification, onDismiss }: ToastItemProps) {
  const icon = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);

  const content = (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className="bg-dark-card border border-dark-border rounded-lg shadow-2xl p-4 min-w-[320px] max-w-sm"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white mb-1">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-400 line-clamp-2">
            {notification.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={onDismiss}>
        {content}
      </Link>
    );
  }

  return content;
}

function getNotificationIcon(type: NotificationType) {
  const iconClass = "w-5 h-5";

  switch (type) {
    case "new_listing":
      return <Bell className={iconClass} />;
    case "new_message":
      return <MessageCircle className={iconClass} />;
    case "listing_like":
      return <Heart className={iconClass} />;
    case "listing_save":
      return <Bookmark className={iconClass} />;
    case "boost_expired":
      return <TrendingUp className={iconClass} />;
    case "premium_expiring":
      return <CreditCard className={iconClass} />;
    case "review_received":
      return <Star className={iconClass} />;
    case "listing_approved":
      return <CheckCircle className={iconClass} />;
    case "listing_removed":
      return <XCircle className={iconClass} />;
    default:
      return <Bell className={iconClass} />;
  }
}

function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case "new_listing":
      return "bg-blue-500/20 text-blue-400";
    case "new_message":
      return "bg-purple-500/20 text-purple-400";
    case "listing_like":
      return "bg-pink-500/20 text-pink-400";
    case "listing_save":
      return "bg-yellow-500/20 text-yellow-400";
    case "boost_expired":
    case "premium_expiring":
      return "bg-orange-500/20 text-orange-400";
    case "review_received":
      return "bg-green-500/20 text-green-400";
    case "listing_approved":
      return "bg-green-500/20 text-green-400";
    case "listing_removed":
      return "bg-red-500/20 text-red-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}
