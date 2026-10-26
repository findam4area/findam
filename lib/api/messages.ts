import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/lib/types";
import { notifyNewMessage } from "./notifications";

/**
 * Create a new conversation
 */
export async function createConversation(
  participantIds: string[],
  listingId?: string,
): Promise<Conversation> {
  const supabase = createClient();

  // Create conversation
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId })
    .select()
    .single();

  if (convError) throw convError;

  // Add participants
  const participants = participantIds.map((userId) => ({
    conversation_id: conversation.id,
    user_id: userId,
  }));

  const { error: participantsError } = await supabase
    .from("conversation_participants")
    .insert(participants);

  if (participantsError) throw participantsError;

  return {
    ...conversation,
    listing_id: conversation.listing_id ?? undefined,
  } as Conversation;
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(
  userId: string,
): Promise<Conversation[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("conversation_participants")
    .select(
      `
      conversation_id,
      conversations (
        id,
        listing_id,
        created_at
      )
    `,
    )
    .eq("user_id", userId);

  if (error) throw error;

  // Get last message and unread count for each conversation
  const conversations = await Promise.all(
    data.map(async (item: any) => {
      const conversation = item.conversations;

      // Get last message
      const { data: lastMessage } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Get unread count
      const { data: participant } = await supabase
        .from("conversation_participants")
        .select("last_read_at")
        .eq("conversation_id", conversation.id)
        .eq("user_id", userId)
        .single();

      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conversation.id)
        .gt("created_at", participant?.last_read_at || "1970-01-01");

      // Get other participants
      const { data: participantsData } = await supabase
        .from("conversation_participants")
        .select(
          `
        user_id,
        users (
          id,
          username,
          avatar_url,
          trust_score
        )
      `,
        )
        .eq("conversation_id", conversation.id)
        .neq("user_id", userId);

      return {
        ...conversation,
        last_message: lastMessage,
        unread_count: unreadCount || 0,
        participants: participantsData?.map((p: any) => p.users) || [],
      };
    }),
  );

  return conversations;
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<Message[]> {
  const supabase = createClient();

  const { data, error } = await supabase
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
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return data as Message[];
}

/**
 * Send a message
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  mediaUrl?: string,
): Promise<Message> {
  const supabase = createClient();

  // Sanitize message content with dompurify (Requirement 6.9)
  // Use client-side sanitization since this runs in browser context
  const sanitizedContent = content.replace(/<[^>]*>/g, "").trim();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: sanitizedContent,
      media_url: mediaUrl,
    })
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
    .single();

  if (error) throw error;

  // Get conversation participants to send notifications
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", senderId);

  // Send notification to all other participants
  if (participants && data.sender) {
    for (const participant of participants) {
      try {
        await notifyNewMessage(
          participant.user_id,
          data.sender.username,
          sanitizedContent,
          conversationId,
        );
      } catch (error) {
        // Don't fail the message send if notification fails
        console.error("Failed to send message notification:", error);
      }
    }
  }

  return data as Message;
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  const supabase = createClient();

  // Update last_read_at for the participant
  const { error } = await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Upload image for message
 */
export async function uploadMessageImage(file: File): Promise<string> {
  const supabase = createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `message-images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("listing-media")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("listing-media").getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Check if conversation exists between users
 */
export async function findConversationBetweenUsers(
  userId1: string,
  userId2: string,
  listingId?: string,
): Promise<Conversation | null> {
  const supabase = createClient();

  // Get all conversations for user1
  const { data: user1Convs } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId1);

  if (!user1Convs || user1Convs.length === 0) return null;

  // Get all conversations for user2
  const { data: user2Convs } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId2);

  if (!user2Convs || user2Convs.length === 0) return null;

  // Find common conversations
  const commonConvIds = user1Convs
    .filter((c1) =>
      user2Convs.some((c2) => c2.conversation_id === c1.conversation_id),
    )
    .map((c) => c.conversation_id);

  if (commonConvIds.length === 0) return null;

  // If listingId is provided, find conversation with that listing
  if (listingId) {
    const { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .in("id", commonConvIds)
      .eq("listing_id", listingId)
      .single();

    return conversation
      ? ({
          ...conversation,
          listing_id: conversation.listing_id ?? undefined,
        } as Conversation)
      : null;
  }

  // Otherwise return the first common conversation
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", commonConvIds[0])
    .single();

  return conversation
    ? ({
        ...conversation,
        listing_id: conversation.listing_id ?? undefined,
      } as Conversation)
    : null;
}

/**
 * Get or create conversation between users
 */
export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string,
  listingId?: string,
): Promise<Conversation> {
  // Check if conversation exists
  const existing = await findConversationBetweenUsers(
    currentUserId,
    otherUserId,
    listingId,
  );

  if (existing) return existing;

  // Create new conversation
  return createConversation([currentUserId, otherUserId], listingId);
}
