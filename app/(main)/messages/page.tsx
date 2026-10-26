"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DynamicConversationList,
  DynamicChatWindow,
} from "@/lib/utils/dynamic-imports";
import type { User } from "@/lib/types";
import { usePresence } from "@/lib/hooks/usePresence";

export default function MessagesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isUserOnline } = usePresence(
    currentUser?.id || null,
    currentUser?.username || "",
  );

  // Load current user
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userData) {
        setCurrentUser(userData as User);
      }

      setIsLoading(false);
    }

    loadUser();
  }, [router]);

  // Load other user when conversation is selected
  useEffect(() => {
    if (!selectedConversationId || !currentUser) return;

    async function loadOtherUser() {
      const supabase = createClient();

      // Get conversation participants
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select(
          `
          user_id,
          users (
            id,
            username,
            avatar_url,
            trust_score,
            is_premium
          )
        `,
        )
        .eq("conversation_id", selectedConversationId!)
        .neq("user_id", currentUser!.id);

      if (participants && participants.length > 0) {
        setOtherUser(participants[0].users as any);
      }
    }

    loadOtherUser();
  }, [selectedConversationId, currentUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-naija-green" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="h-screen flex bg-dark-bg">
      {/* Conversation List - Hidden on mobile when chat is open */}
      <div
        className={`w-full md:w-96 border-r border-dark-border ${
          selectedConversationId ? "hidden md:block" : "block"
        }`}
      >
        <DynamicConversationList
          userId={currentUser.id}
          username={currentUser.username}
          onSelectConversation={setSelectedConversationId}
          selectedConversationId={selectedConversationId}
        />
      </div>

      {/* Chat Window */}
      <div
        className={`flex-1 ${
          selectedConversationId ? "block" : "hidden md:block"
        }`}
      >
        {selectedConversationId && otherUser ? (
          <DynamicChatWindow
            conversationId={selectedConversationId}
            currentUser={currentUser}
            otherUser={otherUser}
            isOnline={isUserOnline(otherUser.id)}
            onBack={() => setSelectedConversationId(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">Select a conversation</p>
              <p className="text-sm">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
