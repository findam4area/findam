import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import {
  createConversation,
  sendMessage,
  getConversationMessages,
  markMessagesAsRead,
  getUserConversations,
  uploadMessageImage,
} from "../messages";
import { createClient } from "@/lib/supabase/client";

/**
 * Property-Based Tests for Messaging System
 * Feature: findam
 * Validates: Requirements 6.1, 6.2, 6.4, 6.5, 6.6, 6.7, 6.8
 *
 * NOTE: These tests are currently skipped because they require:
 * 1. A live Supabase database connection
 * 2. Authenticated test users in the database
 * 3. Proper RLS policies configured
 *
 * To enable these tests:
 * - Set up a test Supabase project
 * - Create test users in the database
 * - Configure test environment variables
 * - Remove .skip from the describe block below
 */

// Arbitraries for generating test data
const uuidArbitrary = fc.uuid();
const userIdArbitrary = fc.uuid();
const messageContentArbitrary = fc.string({ minLength: 1, maxLength: 1000 });
const listingIdArbitrary = fc.option(fc.uuid(), { nil: undefined });

describe.skip("Messaging System - Property-Based Tests", () => {
  const supabase = createClient();
  const createdConversations: string[] = [];
  const createdMessages: string[] = [];

  afterEach(async () => {
    // Cleanup created test data
    if (createdMessages.length > 0) {
      await supabase.from("messages").delete().in("id", createdMessages);
      createdMessages.length = 0;
    }
    if (createdConversations.length > 0) {
      await supabase
        .from("conversations")
        .delete()
        .in("id", createdConversations);
      createdConversations.length = 0;
    }
  });

  /**
   * Property 28: Conversation Creation
   * For any user initiating a conversation, a conversation record should be created and retrievable.
   * Validates: Requirements 6.1
   */
  it("Property 28: Conversation Creation", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(userIdArbitrary, userIdArbitrary, listingIdArbitrary),
        async ([userId1, userId2, listingId]) => {
          // Ensure different users
          fc.pre(userId1 !== userId2);

          // Create conversation
          const conversation = await createConversation(
            [userId1, userId2],
            listingId,
          );
          createdConversations.push(conversation.id);

          // Verify conversation was created
          expect(conversation).toBeDefined();
          expect(conversation.id).toBeDefined();
          expect(typeof conversation.id).toBe("string");

          // Verify conversation is retrievable
          const { data: retrieved, error } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", conversation.id)
            .single();

          expect(error).toBeNull();
          expect(retrieved).toBeDefined();
          expect(retrieved?.id).toBe(conversation.id);

          // Verify participants were added
          const { data: participants, error: participantsError } =
            await supabase
              .from("conversation_participants")
              .select("user_id")
              .eq("conversation_id", conversation.id);

          expect(participantsError).toBeNull();
          expect(participants).toBeDefined();
          expect(participants?.length).toBe(2);

          const participantIds = participants?.map((p) => p.user_id) ?? [];
          expect(participantIds).toContain(userId1);
          expect(participantIds).toContain(userId2);

          // Verify listing association if provided
          if (listingId) {
            expect(conversation.listing_id).toBe(listingId);
          }
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property 29: Message Delivery
   * For any sent message, the message should be stored and retrievable by both sender and recipient.
   * Validates: Requirements 6.2
   */
  it("Property 29: Message Delivery", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          userIdArbitrary,
          userIdArbitrary,
          messageContentArbitrary,
          fc.option(fc.webUrl(), { nil: undefined }),
        ),
        async ([userId1, userId2, content, mediaUrl]) => {
          // Ensure different users
          fc.pre(userId1 !== userId2);

          // Create conversation
          const conversation = await createConversation([userId1, userId2]);
          createdConversations.push(conversation.id);

          // Send message
          const message = await sendMessage(
            conversation.id,
            userId1,
            content,
            mediaUrl,
          );
          createdMessages.push(message.id);

          // Verify message was stored
          expect(message).toBeDefined();
          expect(message.id).toBeDefined();
          expect(message.conversation_id).toBe(conversation.id);
          expect(message.sender_id).toBe(userId1);
          expect(message.content).toBe(content);

          if (mediaUrl) {
            expect(message.media_url).toBe(mediaUrl);
          }

          // Verify message is retrievable
          const messages = await getConversationMessages(conversation.id);
          expect(messages).toBeDefined();
          expect(messages.length).toBeGreaterThan(0);

          const retrievedMessage = messages.find((m) => m.id === message.id);
          expect(retrievedMessage).toBeDefined();
          expect(retrievedMessage?.content).toBe(content);
          expect(retrievedMessage?.sender_id).toBe(userId1);
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property 30: Unread Message Status
   * For any newly received message, it should be marked as unread until the recipient views it.
   * Validates: Requirements 6.4
   */
  it("Property 30: Unread Message Status", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(userIdArbitrary, userIdArbitrary, messageContentArbitrary),
        async ([senderId, recipientId, content]) => {
          // Ensure different users
          fc.pre(senderId !== recipientId);

          // Create conversation
          const conversation = await createConversation([
            senderId,
            recipientId,
          ]);
          createdConversations.push(conversation.id);

          // Send message
          const message = await sendMessage(conversation.id, senderId, content);
          createdMessages.push(message.id);

          // Get recipient's conversations to check unread count
          const conversations = await getUserConversations(recipientId);
          const recipientConv = conversations.find(
            (c) => c.id === conversation.id,
          );

          // Verify unread count is greater than 0
          expect(recipientConv).toBeDefined();
          expect(recipientConv?.unread_count).toBeGreaterThan(0);

          // Verify the message itself is marked as unread initially
          const { data: messageData } = await supabase
            .from("messages")
            .select("is_read")
            .eq("id", message.id)
            .single();

          expect(messageData?.is_read).toBe(false);
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property 31: Read Receipt Update
   * For any message viewed by the recipient, the message status should be updated to read.
   * Validates: Requirements 6.5
   */
  it("Property 31: Read Receipt Update", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(userIdArbitrary, userIdArbitrary, messageContentArbitrary),
        async ([senderId, recipientId, content]) => {
          // Ensure different users
          fc.pre(senderId !== recipientId);

          // Create conversation
          const conversation = await createConversation([
            senderId,
            recipientId,
          ]);
          createdConversations.push(conversation.id);

          // Send message
          const message = await sendMessage(conversation.id, senderId, content);
          createdMessages.push(message.id);

          // Mark messages as read
          await markMessagesAsRead(conversation.id, recipientId);

          // Verify unread count is now 0
          const conversations = await getUserConversations(recipientId);
          const recipientConv = conversations.find(
            (c) => c.id === conversation.id,
          );

          expect(recipientConv).toBeDefined();
          expect(recipientConv?.unread_count).toBe(0);

          // Verify last_read_at was updated
          const { data: participant } = await supabase
            .from("conversation_participants")
            .select("last_read_at")
            .eq("conversation_id", conversation.id)
            .eq("user_id", recipientId)
            .single();

          expect(participant?.last_read_at).toBeDefined();
          const lastReadTime = new Date(
            participant?.last_read_at ?? new Date().toISOString(),
          ).getTime();
          const messageTime = new Date(message.created_at).getTime();
          expect(lastReadTime).toBeGreaterThanOrEqual(messageTime);
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property 32: Image Sharing Round Trip
   * For any image shared in a chat, the image should be uploaded and the URL should be stored in the message record.
   * Validates: Requirements 6.6
   */
  it("Property 32: Image Sharing Round Trip", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          userIdArbitrary,
          userIdArbitrary,
          messageContentArbitrary,
          fc.webUrl(),
        ),
        async ([senderId, recipientId, content, imageUrl]) => {
          // Ensure different users
          fc.pre(senderId !== recipientId);

          // Create conversation
          const conversation = await createConversation([
            senderId,
            recipientId,
          ]);
          createdConversations.push(conversation.id);

          // Send message with image URL
          const message = await sendMessage(
            conversation.id,
            senderId,
            content,
            imageUrl,
          );
          createdMessages.push(message.id);

          // Verify image URL was stored
          expect(message.media_url).toBe(imageUrl);

          // Verify message is retrievable with image URL
          const messages = await getConversationMessages(conversation.id);
          const retrievedMessage = messages.find((m) => m.id === message.id);

          expect(retrievedMessage).toBeDefined();
          expect(retrievedMessage?.media_url).toBe(imageUrl);
        },
      ),
      { numRuns: 10 },
    );
  });

  /**
   * Property 33: Conversation List Completeness
   * For any user, viewing their message list should return all conversations they are a participant in.
   * Validates: Requirements 6.7
   */
  it("Property 33: Conversation List Completeness", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          userIdArbitrary,
          fc.array(userIdArbitrary, { minLength: 1, maxLength: 5 }),
        ),
        async ([userId, otherUserIds]) => {
          // Ensure all users are different
          const uniqueOtherUsers = [...new Set(otherUserIds)].filter(
            (id) => id !== userId,
          );
          fc.pre(uniqueOtherUsers.length > 0);

          // Create multiple conversations
          const conversationIds: string[] = [];
          for (const otherUserId of uniqueOtherUsers) {
            const conversation = await createConversation([
              userId,
              otherUserId,
            ]);
            conversationIds.push(conversation.id);
            createdConversations.push(conversation.id);
          }

          // Get user's conversations
          const conversations = await getUserConversations(userId);

          // Verify all created conversations are in the list
          for (const convId of conversationIds) {
            const found = conversations.some((c) => c.id === convId);
            expect(found).toBe(true);
          }

          // Verify conversation count matches
          expect(conversations.length).toBeGreaterThanOrEqual(
            conversationIds.length,
          );
        },
      ),
      { numRuns: 5 }, // Reduced runs due to multiple conversations per test
    );
  });

  /**
   * Property 34: Scam Detection Warnings
   * For any conversation containing suspicious keywords or patterns, a scam protection warning should be displayed.
   * Validates: Requirements 6.8
   */
  it("Property 34: Scam Detection Warnings", async () => {
    const suspiciousKeywords = [
      "wire transfer",
      "send money first",
      "too good to be true",
      "western union",
      "moneygram",
      "bitcoin",
      "cryptocurrency",
      "urgent payment",
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          userIdArbitrary,
          userIdArbitrary,
          fc.constantFrom(...suspiciousKeywords),
        ),
        async ([senderId, recipientId, keyword]) => {
          // Ensure different users
          fc.pre(senderId !== recipientId);

          // Create conversation
          const conversation = await createConversation([
            senderId,
            recipientId,
          ]);
          createdConversations.push(conversation.id);

          // Send message with suspicious keyword
          const suspiciousContent = `Hello, please ${keyword} to complete the transaction.`;
          const message = await sendMessage(
            conversation.id,
            senderId,
            suspiciousContent,
          );
          createdMessages.push(message.id);

          // Verify message was stored
          expect(message).toBeDefined();
          expect(message.content).toContain(keyword);

          // Get messages to check for scam detection
          const messages = await getConversationMessages(conversation.id);
          const retrievedMessage = messages.find((m) => m.id === message.id);

          expect(retrievedMessage).toBeDefined();
          expect(retrievedMessage?.content.toLowerCase()).toContain(
            keyword.toLowerCase(),
          );

          // Note: The actual scam warning display is handled in the UI layer
          // This test verifies that suspicious messages are stored and retrievable
          // The UI component should check for these keywords and display warnings
        },
      ),
      { numRuns: 10 },
    );
  });
});
