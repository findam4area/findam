"use client";

import { useNotifications } from "@/lib/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
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
} from "lucide-react";
import Link from "next/link";
import type { Notification, NotificationType } from "@/lib/types";

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

export function NotificationItem({
  notification,
  onClose,
}: NotificationItemProps) {
  const { markAsRead } = useNotifications();

  const handleClick = async () => {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    onClose?.();
  };

  const icon = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);

  const content = (
    <div
      className={cn(
        "p-4 hover:bg-dark-bg transition-colors cursor-pointer",
        !notification.is_read && "bg-dark-bg/50",
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            iconColor,
          )}
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
          <p className="text-xs text-gray-500 mt-2">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>

        {/* Unread Indicator */}
        {!notification.is_read && (
          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-naija-green" />
        )}
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
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
