import { useEffect, useState } from "react";
import {
  trackPresence,
  subscribeToPresence,
  getOnlineUsers,
  unsubscribeChannel,
} from "@/lib/supabase/realtime";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function usePresence(userId: string | null, username: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Track presence
    const presenceChannel = trackPresence(userId, username);
    setChannel(presenceChannel);

    // Subscribe to presence changes
    subscribeToPresence(
      presenceChannel,
      (joinedUserId) => {
        setOnlineUsers((prev) => {
          if (prev.includes(joinedUserId)) return prev;
          return [...prev, joinedUserId];
        });
      },
      (leftUserId) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== leftUserId));
      },
    );

    // Get initial online users after subscription
    presenceChannel.on("presence", { event: "sync" }, () => {
      const users = getOnlineUsers(presenceChannel);
      setOnlineUsers(users);
    });

    // Cleanup
    return () => {
      if (presenceChannel) {
        unsubscribeChannel(presenceChannel);
      }
    };
  }, [userId, username]);

  const isUserOnline = (checkUserId: string): boolean => {
    return onlineUsers.includes(checkUserId);
  };

  return {
    onlineUsers,
    isUserOnline,
    channel,
  };
}
