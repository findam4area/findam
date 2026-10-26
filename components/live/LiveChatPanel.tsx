"use client";

/**
 * Live Chat Panel Component
 *
 * Displays real-time chat messages and allows viewers to send messages.
 * Uses Supabase Realtime for instant message delivery.
 *
 * Requirements: 2.3
 * Task: 19.3
 */

import { useEffect, useRef, useState } from "react";
import { Send, Trash2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { LiveChatMessage } from "@/lib/types";

interface LiveChatPanelProps {
  sessionId: string;
  currentUserId?: string;
  isHost?: boolean;
  className?: string;
}

interface ChatMessageWithUser extends Omit<LiveChatMessage, "user"> {
  user?: {
    username: string;
    avatar_url: string | null;
  };
}

export function LiveChatPanel({
  sessionId,
  currentUserId,
  isHost = false,
  className = "",
}: LiveChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageWithUser[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to real-time chat messages
  useEffect(() => {
    const supabase = createClient();

    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await (supabase.from("live_chat_messages") as any)
        .select(
          `
          *,
          user:users!user_id(username, avatar_url)
        `,
        )
        .eq("session_id", sessionId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Failed to fetch messages:", error);
        return;
      }

      setMessages((data as any) || []);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`live-chat-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload: any) => {
          // Fetch user info for the new message
          const { data: userData } = await (supabase.from("users") as any)
            .select("username, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          const newMsg: any = {
            ...payload.new,
            user: userData || undefined,
          };

          setMessages((prev) => [...prev, newMsg]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: any) => {
          // Handle message deletion or flagging
          setMessages((prev: any) =>
            prev.map((msg: any) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg,
            ),
          );
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUserId) {
      return;
    }

    // Validate message length (max 500 characters)
    if (newMessage.length > 500) {
      setError("Message is too long (max 500 characters)");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: insertError } = await supabase
        .from("live_chat_messages")
        .insert({
          session_id: sessionId,
          user_id: currentUserId,
          message: newMessage.trim(),
        });

      if (insertError) {
        throw insertError;
      }

      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Delete message (host only)
  const handleDeleteMessage = async (messageId: string) => {
    if (!isHost) return;

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("live_chat_messages")
        .update({ is_deleted: true })
        .eq("id", messageId);

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Live Chat
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {messages.length} messages
        </p>
      </div>

      {/* Messages Container */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        role="log"
        aria-live="polite"
        aria-label="Live chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
            No messages yet. Be the first to chat!
          </div>
        ) : (
          messages
            .filter((msg) => !msg.is_deleted)
            .map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-2 group"
                role="article"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {msg.user?.avatar_url ? (
                    <img
                      src={msg.user.avatar_url}
                      alt={msg.user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                      {msg.user?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {msg.user?.username || "Anonymous"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                    {msg.message}
                  </p>
                  {msg.is_flagged && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3 h-3" />
                      <span>Flagged for review</span>
                    </div>
                  )}
                </div>

                {/* Delete Button (Host Only) */}
                {isHost && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                    aria-label="Delete message"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                )}
              </div>
            ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {currentUserId ? (
        <form
          onSubmit={handleSendMessage}
          className="px-4 py-3 border-t border-gray-200 dark:border-gray-800"
        >
          {error && (
            <div className="mb-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a message..."
              maxLength={500}
              disabled={isSending}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
              aria-label="Chat message input"
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {newMessage.length}/500 characters
          </div>
        </form>
      ) : (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
          Sign in to chat
        </div>
      )}
    </div>
  );
}
