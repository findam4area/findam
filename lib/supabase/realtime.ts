import { createClient } from "./client";
import type { Message, Notification } from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribe to new messages in a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (message: Message) => void,
): RealtimeChannel {
  const supabase = createClient();

  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        // Fetch the complete message with sender info
        const { data: message } = await supabase
          .from("messages")
          .select(
            `
            *,
            sender:users (
              id,
              username,
              avatar_url
            )
          `,
          )
          .eq("id", payload.new.id)
          .single();

        if (message) {
          callback(message as Message);
        }
      },
    )
    .subscribe();
}

/**
 * Subscribe to message updates (read receipts)
 */
export function subscribeToMessageUpdates(
  conversationId: string,
  callback: (message: Message) => void,
): RealtimeChannel {
  const supabase = createClient();

  return supabase
    .channel(`conversation-updates:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      },
    )
    .subscribe();
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void,
): RealtimeChannel {
  const supabase = createClient();

  return supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Notification);
      },
    )
    .subscribe();
}

/**
 * Track user presence (online status)
 */
export function trackPresence(
  userId: string,
  username: string,
): RealtimeChannel {
  const supabase = createClient();

  const channel = supabase.channel("online-users", {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        user_id: userId,
        username: username,
        online_at: new Date().toISOString(),
      });
    }
  });

  return channel;
}

/**
 * Get online users from presence
 */
export function getOnlineUsers(channel: RealtimeChannel): string[] {
  const presenceState = channel.presenceState();
  const onlineUserIds: string[] = [];

  Object.values(presenceState).forEach((presences: any) => {
    presences.forEach((presence: any) => {
      if (presence.user_id) {
        onlineUserIds.push(presence.user_id);
      }
    });
  });

  return onlineUserIds;
}

/**
 * Subscribe to presence changes
 */
export function subscribeToPresence(
  channel: RealtimeChannel,
  onJoin: (userId: string) => void,
  onLeave: (userId: string) => void,
): void {
  channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
    newPresences.forEach((presence: any) => {
      if (presence.user_id) {
        onJoin(presence.user_id);
      }
    });
  });

  channel.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
    leftPresences.forEach((presence: any) => {
      if (presence.user_id) {
        onLeave(presence.user_id);
      }
    });
  });
}

/**
 * Broadcast typing indicator
 */
export function broadcastTyping(
  channel: RealtimeChannel,
  userId: string,
  isTyping: boolean,
): void {
  channel.send({
    type: "broadcast",
    event: isTyping ? "typing" : "stop_typing",
    payload: { user_id: userId },
  });
}

/**
 * Subscribe to typing indicators
 */
export function subscribeToTyping(
  channel: RealtimeChannel,
  onTyping: (userId: string, isTyping: boolean) => void,
): void {
  channel.on("broadcast", { event: "typing" }, ({ payload }) => {
    onTyping(payload.user_id, true);
  });

  channel.on("broadcast", { event: "stop_typing" }, ({ payload }) => {
    onTyping(payload.user_id, false);
  });
}

/**
 * Unsubscribe and remove a channel
 */
export async function unsubscribeChannel(
  channel: RealtimeChannel,
): Promise<void> {
  await channel.unsubscribe();
}
