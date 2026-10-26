/**
 * Live Session Notification Service
 *
 * Handles notifications for live streaming events including
 * follower alerts when sellers go live.
 *
 * Requirements: 2.7
 * Task: 19.7
 */

import { createClient } from "@/lib/supabase/server";

/**
 * Notify followers when a seller goes live
 *
 * Requirements: 2.7
 *
 * @param sessionId - Live session ID
 * @param sellerId - Seller user ID
 * @param sessionTitle - Live session title
 */
export async function notifyFollowersLive(
  sessionId: string,
  sellerId: string,
  sessionTitle: string,
): Promise<void> {
  try {
    const supabase = await createClient();

    // Get seller info
    const { data: seller } = await (supabase as any)
      .from("users")
      .select("username")
      .eq("id", sellerId)
      .single();

    if (!seller) {
      console.error("Seller not found");
      return;
    }

    // Get all followers of the seller
    // Assuming there's a follows table with follower_id and following_id
    const { data: followers, error: followersError } = await (supabase as any)
      .from("follows")
      .select("follower_id, username:users!follower_id(username)")
      .eq("following_id", sellerId);

    if (followersError) {
      console.error("Failed to fetch followers:", followersError);
      return;
    }

    if (!followers || followers.length === 0) {
      console.log("No followers to notify");
      return;
    }

    // Create notifications for all followers
    const notifications = followers.map((follow: any) => ({
      user_id: follow.follower_id,
      type: "live_session_started" as const,
      title: `${seller.username ?? "A seller"} is live!`,
      message: sessionTitle || "Join the live session now",
      link: `/live/${sessionId}`,
      is_read: false,
    }));

    // Batch insert notifications
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notificationError) {
      console.error("Failed to create notifications:", notificationError);
      return;
    }

    console.log(`Notified ${followers.length} followers about live session`);

    // TODO: Send push notifications via web push API or FCM
    // This would require additional setup with service workers and push subscriptions
  } catch (error) {
    console.error("Error notifying followers:", error);
  }
}

/**
 * Notify session participants when session ends
 *
 * @param sessionId - Live session ID
 * @param sellerId - Seller user ID
 * @param recordingUrl - Recording URL (if available)
 */
export async function notifySessionEnded(
  sessionId: string,
  sellerId: string,
  recordingUrl?: string,
): Promise<void> {
  try {
    const supabase = await createClient();

    // Get seller info
    const { data: seller } = await (supabase as any)
      .from("users")
      .select("username")
      .eq("id", sellerId)
      .single();

    if (!seller) {
      console.error("Seller not found");
      return;
    }

    // Get unique viewers who participated in chat
    const { data: chatParticipants } = await supabase
      .from("live_chat_messages")
      .select("user_id")
      .eq("session_id", sessionId)
      .neq("user_id", sellerId); // Exclude seller

    if (!chatParticipants || chatParticipants.length === 0) {
      return;
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(chatParticipants.map((p) => p.user_id))];

    // Create notifications for participants
    const message = recordingUrl
      ? "The recording is available for 24 hours"
      : "Thanks for watching!";

    const notifications = uniqueUserIds.map((userId) => ({
      user_id: userId,
      type: "live_session_ended" as const,
      title: `${seller.username ?? "A seller"}'s live session ended`,
      message,
      link: recordingUrl ? `/live/${sessionId}` : undefined,
      is_read: false,
    }));

    // Batch insert notifications
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notificationError) {
      console.error("Failed to create end notifications:", notificationError);
    }
  } catch (error) {
    console.error("Error notifying session end:", error);
  }
}

/**
 * Notify seller when session is approaching time limit
 *
 * Requirements: 2.9
 *
 * @param sessionId - Live session ID
 * @param sellerId - Seller user ID
 * @param minutesRemaining - Minutes remaining before auto-end
 */
export async function notifySessionTimeLimit(
  sessionId: string,
  sellerId: string,
  minutesRemaining: number,
): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase.from("notifications").insert({
      user_id: sellerId,
      type: "live_session_warning" as const,
      title: "Live session time limit approaching",
      message: `Your session will automatically end in ${minutesRemaining} minutes`,
      link: `/live/${sessionId}`,
      is_read: false,
    });
  } catch (error) {
    console.error("Error notifying time limit:", error);
  }
}

/**
 * Notify seller when session is terminated for moderation
 *
 * Requirements: 2.10
 *
 * @param sessionId - Live session ID
 * @param sellerId - Seller user ID
 * @param reason - Termination reason
 */
export async function notifySessionTerminated(
  sessionId: string,
  sellerId: string,
  reason: string,
): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase.from("notifications").insert({
      user_id: sellerId,
      type: "live_session_terminated" as const,
      title: "Live session terminated",
      message: `Your session was terminated: ${reason}`,
      link: `/live/${sessionId}`,
      is_read: false,
    });
  } catch (error) {
    console.error("Error notifying termination:", error);
  }
}
