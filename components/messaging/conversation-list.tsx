"use client";

import { useEffect, useState, useCallback } from "react";
import { useMessagesStore } from "@/store/messages";
import { getUserConversations } from "@/lib/api/messages";
import { usePresence } from "@/lib/hooks/usePresence";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import type { Conversation } from "@/lib/types";

interface ConversationListProps {
  userId: string;
  username: string;
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string | null;
}

export function ConversationList({
  userId,
  username,
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const { conversations, setConversations, unreadCount } = useMessagesStore();
  const { isUserOnline } = usePresence(userId, username);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const convs = await getUserConversations(userId);
      setConversations(convs);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, setConversations]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;

    const otherUser = conv.participants?.[0];
    if (!otherUser) return false;

    return otherUser.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-naija-green" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-dark-bg">
      {/* Header */}
      <div className="p-4 border-b border-dark-border">
        <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-dark-card border-dark-border text-white"
          />
        </div>
      </div>

      {/* Conversation List */}
      <PullToRefresh onRefresh={loadConversations} className="flex-1">
        <div className="overflow-y-auto h-full">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-center">
                {searchQuery
                  ? "No conversations found"
                  : "No messages yet. Start a conversation!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversationId === conversation.id}
                  isOnline={
                    conversation.participants?.[0]
                      ? isUserOnline(conversation.participants[0].id)
                      : false
                  }
                  onClick={() => onSelectConversation(conversation.id)}
                />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  isOnline: boolean;
  onClick: () => void;
}

function ConversationItem({
  conversation,
  isSelected,
  isOnline,
  onClick,
}: ConversationItemProps) {
  const otherUser = conversation.participants?.[0];
  const lastMessage = conversation.last_message;
  const unreadCount = conversation.unread_count || 0;

  if (!otherUser) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 flex items-start gap-3 hover:bg-dark-card transition-colors text-left",
        isSelected && "bg-dark-card border-l-4 border-naija-green",
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-naija-green to-neon-cyan flex items-center justify-center text-white font-bold">
          {otherUser.avatar_url ? (
            <Image
              src={otherUser.avatar_url}
              alt={otherUser.username}
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
          ) : (
            otherUser.username.charAt(0).toUpperCase()
          )}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-bg" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-white truncate">
            {otherUser.username}
          </h3>
          {lastMessage && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {formatDistanceToNow(new Date(lastMessage.created_at), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
        {lastMessage && (
          <p className="text-sm text-gray-400 truncate">
            {lastMessage.media_url ? "📷 Image" : lastMessage.content}
          </p>
        )}
      </div>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <div className="flex-shrink-0 bg-naija-green text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </div>
      )}
    </button>
  );
}
