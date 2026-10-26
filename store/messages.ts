import { create } from "zustand";
import type { Conversation, Message } from "@/lib/types";

interface MessagesState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  unreadCount: number;
  isLoading: boolean;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  unreadCount: 0,
  isLoading: false,
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),
  setActiveConversation: (activeConversationId) =>
    set({ activeConversationId }),
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),
  addMessage: (conversationId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), message],
      },
    })),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
  decrementUnreadCount: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      conversations: [],
      activeConversationId: null,
      messages: {},
      unreadCount: 0,
      isLoading: false,
    }),
}));
