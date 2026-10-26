import { createClient } from "@/lib/supabase/client";
import type {
  Notification,
  NotificationPreferences,
  NotificationType,
} from "@/lib/types";

/**
 * Create a new notification for a user
 */
export async function createNotification(data: {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}): Promise<Notification> {
  const supabase = createClient();

  // Check user's notification preferences before creating
  const preferences = await getNotificationPreferences(data.user_id);
  if (preferences && !shouldSendNotification(data.type, preferences)) {
    throw new Error("Notification disabled by user preferences");
  }

  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      is_read: false,
    })
    .select()
    .single();

  if (error) throw error;
  return notification as unknown as Notification;
}

/**
 * Get notifications for a user with pagination
 */
export async function getNotifications(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {},
): Promise<Notification[]> {
  const supabase = createClient();
  const { limit = 20, offset = 0, unreadOnly = false } = options;

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as unknown as Notification[];
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) throw error;
}

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
  return data as NotificationPreferences | null;
}

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<
    Omit<NotificationPreferences, "user_id" | "created_at" | "updated_at">
  >,
): Promise<NotificationPreferences> {
  const supabase = createClient();

  // Try to update first
  const { data: existing } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Update existing preferences
    const { data, error } = await supabase
      .from("notification_preferences")
      .update({
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as NotificationPreferences;
  } else {
    // Create new preferences with defaults
    const { data, error } = await supabase
      .from("notification_preferences")
      .insert({
        user_id: userId,
        new_listing: preferences.new_listing ?? true,
        new_message: preferences.new_message ?? true,
        listing_interactions: preferences.listing_interactions ?? true,
        payment_updates: preferences.payment_updates ?? true,
        admin_updates: preferences.admin_updates ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as NotificationPreferences;
  }
}

/**
 * Helper function to determine if a notification should be sent based on preferences
 */
function shouldSendNotification(
  type: NotificationType,
  preferences: NotificationPreferences,
): boolean {
  switch (type) {
    case "new_listing":
      return preferences.new_listing;
    case "new_message":
      return preferences.new_message;
    case "listing_like":
    case "listing_save":
      return preferences.listing_interactions;
    case "boost_expired":
    case "premium_expiring":
      return preferences.payment_updates;
    case "review_received":
    case "listing_approved":
    case "listing_removed":
      return preferences.admin_updates;
    default:
      return true;
  }
}

/**
 * Helper functions to create specific notification types
 */

export async function notifyNewListing(
  userId: string,
  listingTitle: string,
  listingId: string,
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: "new_listing",
    title: "New listing matches your interests",
    message: `Check out: ${listingTitle}`,
    link: `/listing/${listingId}`,
  });
}

export async function notifyNewMessage(
  userId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string,
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: "new_message",
    title: `New message from ${senderName}`,
    message: messagePreview.substring(0, 100),
    link: `/messages?conversation=${conversationId}`,
  });
}

export async function notifyListingLike(
  userId: string,
  likerName: string,
  listingTitle: string,
  listingId: string,
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: "listing_like",
    title: "Someone liked your listing",
    message: `${likerName} liked "${listingTitle}"`,
    link: `/listing/${listingId}`,
  });
}

export async function notifyListingSave(
  userId: string,
  saverName: string,
  listingTitle: string,
  listingId: string,
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: "listing_save",
    title: "Someone saved your listing",
    message: `${saverName} saved "${listingTitle}"`,
    link: `/listing/${listingId}`,
  });
}

export async function notifyBoostExpired(
  userId: string,
  listingTitle: string,
  listingId: string,
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: "boost_expired",
    title: "Boost expired",
    message: `Your boost for "${listingTitle}" has expired. Renew to keep it visible!`,
    link: `/listing/${listingId}`,
  });
}

export async function notifyPremiumExpiring(
  userId: string,
  daysRemaining: number,
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: "premium_expiring",
    title: "Premium subscription expiring soon",
    message: `Your premium subscription expires in ${daysRemaining} days. Renew to keep your benefits!`,
    link: "/premium",
  });
}

export async function notifyReviewReceived(
  userId: string,
  reviewerName: string,
  rating: number,
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: "review_received",
    title: "New review received",
    message: `${reviewerName} left you a ${rating}-star review`,
    link: "/profile",
  });
}

export async function notifyListingApproved(
  userId: string,
  listingTitle: string,
  listingId: string,
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: "listing_approved",
    title: "Listing approved",
    message: `Your listing "${listingTitle}" has been approved and is now live`,
    link: `/listing/${listingId}`,
  });
}

export async function notifyListingRemoved(
  userId: string,
  listingTitle: string,
  reason: string,
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    type: "listing_removed",
    title: "Listing removed",
    message: `Your listing "${listingTitle}" was removed. Reason: ${reason}`,
    link: "/profile",
  });
}
