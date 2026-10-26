import { useEffect, useState, useCallback, useRef } from "react";
import { useMessagesStore } from "@/store/messages";
import {
  subscribeToMessages,
  subscribeToTyping,
  broadcastTyping,
  unsubscribeChannel,
} from "@/lib/supabase/realtime";
import {
  getConversationMessages,
  sendMessage as apiSendMessage,
  markMessagesAsRead,
} from "@/lib/api/messages";
import type { Message } from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useMessaging(conversationId: string | null, userId: string) {
  const {
    messages,
    setMessages,
    addMessage,
    activeConversationId,
    setActiveConversation,
  } = useMessagesStore();

  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Load messages for conversation
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    setIsLoading(true);
    try {
      const msgs = await getConversationMessages(conversationId);
      setMessages(conversationId, msgs);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, setMessages]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string, mediaUrl?: string) => {
      if (!conversationId) return;

      try {
        const message = await apiSendMessage(
          conversationId,
          userId,
          content,
          mediaUrl,
        );
        // Message will be added via realtime subscription
        return message;
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    },
    [conversationId, userId],
  );

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await markMessagesAsRead(conversationId, userId);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [conversationId, userId]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!channelRef.current) return;

    broadcastTyping(channelRef.current, userId, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        broadcastTyping(channelRef.current, userId, false);
      }
    }, 3000);
  }, [userId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    // Load initial messages
    loadMessages();

    // Set active conversation
    setActiveConversation(conversationId);

    // Subscribe to new messages
    const messageChannel = subscribeToMessages(conversationId, (message) => {
      addMessage(conversationId, message);

      // Mark as read if this is the active conversation
      if (message.sender_id !== userId) {
        markAsRead();
      }
    });

    channelRef.current = messageChannel;

    // Subscribe to typing indicators
    subscribeToTyping(messageChannel, (typingUserId, isTyping) => {
      if (typingUserId === userId) return; // Ignore own typing

      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) {
          next.add(typingUserId);
        } else {
          next.delete(typingUserId);
        }
        return next;
      });
    });

    // Cleanup
    return () => {
      if (channelRef.current) {
        unsubscribeChannel(channelRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [
    conversationId,
    userId,
    loadMessages,
    addMessage,
    markAsRead,
    setActiveConversation,
  ]);

  return {
    messages: conversationId ? messages[conversationId] || [] : [],
    isLoading,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    markAsRead,
    handleTyping,
  };
}
