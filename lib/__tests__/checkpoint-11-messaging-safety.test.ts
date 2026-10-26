import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@/lib/supabase/client";
import { detectScamPatterns, shouldAutoFlag } from "@/lib/utils/scam-detection";
import type { Listing } from "@/lib/types";

/**
 * Checkpoint 11: Messaging and Safety Features Validation
 *
 * This test suite validates:
 * 1. Real-time messaging infrastructure is configured
 * 2. Messaging components are implemented
 * 3. Scam detection system is working
 * 4. Verification flows are implemented
 * 5. Safety features are in place
 */

describe("Checkpoint 11: Messaging and Safety Features", () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient();
  });

  describe("1. Real-Time Messaging Infrastructure", () => {
    it("should have Supabase Realtime configured", () => {
      expect(supabase).toBeDefined();
      expect(supabase.channel).toBeDefined();
      expect(typeof supabase.channel).toBe("function");
    });

    it("should be able to create a realtime channel", () => {
      const channel = supabase.channel("test-channel");
      expect(channel).toBeDefined();
      expect(typeof channel.subscribe).toBe("function");
      expect(typeof channel.unsubscribe).toBe("function");
    });

    it("should have conversations table accessible", async () => {
      const { error } = await supabase
        .from("conversations")
        .select("id")
        .limit(1);

      expect(error?.code).not.toBe("42P01"); // Table doesn't exist error
    }, 15000); // Increased timeout for database query

    it("should have messages table accessible", async () => {
      const { error } = await supabase.from("messages").select("id").limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should have conversation_participants table accessible", async () => {
      const { error } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });
  });

  describe("2. Messaging Components", () => {
    it("should have messaging components available", async () => {
      try {
        const { ChatWindow } =
          await import("@/components/messaging/chat-window");
        const { ConversationList } =
          await import("@/components/messaging/conversation-list");

        expect(ChatWindow).toBeDefined();
        expect(ConversationList).toBeDefined();
      } catch (error) {
        console.error("Failed to import messaging components:", error);
        throw error;
      }
    }, 30000); // Increase timeout to 30 seconds for component imports

    it("should have messaging API functions available", async () => {
      const messagesApi = await import("@/lib/api/messages");

      expect(messagesApi.createConversation).toBeDefined();
      expect(messagesApi.sendMessage).toBeDefined();
      expect(messagesApi.getConversationMessages).toBeDefined();
      expect(messagesApi.markMessagesAsRead).toBeDefined();
      expect(messagesApi.getUserConversations).toBeDefined();
    });

    it("should have realtime utilities available", async () => {
      const realtimeUtils = await import("@/lib/supabase/realtime");

      expect(realtimeUtils.subscribeToMessages).toBeDefined();
      expect(realtimeUtils.subscribeToMessageUpdates).toBeDefined();
      expect(realtimeUtils.trackPresence).toBeDefined();
      expect(realtimeUtils.broadcastTyping).toBeDefined();
      expect(realtimeUtils.subscribeToTyping).toBeDefined();
    });

    it("should have messaging hooks available", async () => {
      const { useMessaging } = await import("@/lib/hooks/useMessaging");
      expect(useMessaging).toBeDefined();
    });

    it("should have messages store available", async () => {
      const { useMessagesStore } = await import("@/store/messages");
      expect(useMessagesStore).toBeDefined();

      const store = useMessagesStore.getState();
      expect(store.conversations).toBeDefined();
      expect(store.messages).toBeDefined();
      expect(store.setMessages).toBeDefined();
      expect(store.addMessage).toBeDefined();
    });
  });

  describe("3. Scam Detection System", () => {
    it("should detect suspicious keywords", () => {
      const suspiciousListing: Listing = {
        id: "test-1",
        user_id: "user-1",
        title: "iPhone 14 Pro Max",
        description:
          "Brand new iPhone, send money first via wire transfer to secure",
        price: 50000,
        category_id: "cat-1",
        subcategory_id: "subcat-1",
        state: "Lagos",
        lga: "Ikeja",
        is_boosted: false,
        is_active: true,
        views_count: 0,
        likes_count: 0,
        saves_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = detectScamPatterns(suspiciousListing);

      expect(result.is_suspicious).toBe(true);
      expect(result.flags).toContain("suspicious_keywords");
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it("should detect price anomalies", () => {
      const suspiciousListing: Listing = {
        id: "test-2",
        user_id: "user-1",
        title: "iPhone 14 Pro Max",
        description: "Brand new iPhone in perfect condition",
        price: 10000, // Unrealistically low
        category_id: "cat-1",
        subcategory_id: "subcat-1",
        state: "Lagos",
        lga: "Ikeja",
        is_boosted: false,
        is_active: true,
        views_count: 0,
        likes_count: 0,
        saves_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = detectScamPatterns(suspiciousListing);

      expect(result.is_suspicious).toBe(true);
      expect(
        result.flags.includes("price_anomaly") ||
          result.flags.includes("unrealistic_price"),
      ).toBe(true);
    }, 15000); // Increased timeout for scam detection

    it("should not flag legitimate listings", () => {
      const legitimateListing: Listing = {
        id: "test-3",
        user_id: "user-1",
        title: "iPhone 14 Pro Max",
        description:
          "Gently used iPhone 14 Pro Max in excellent condition. Comes with original box and charger. Available for inspection in Lagos.",
        price: 800000,
        category_id: "cat-1",
        subcategory_id: "subcat-1",
        state: "Lagos",
        lga: "Ikeja",
        condition: "used",
        is_boosted: false,
        is_active: true,
        views_count: 0,
        likes_count: 0,
        saves_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = detectScamPatterns(legitimateListing);

      expect(result.is_suspicious).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it("should auto-flag high-risk listings", () => {
      const highRiskListing: Listing = {
        id: "test-4",
        user_id: "user-1",
        title: "iPhone 14 Pro Max - Too Good to be True!",
        description:
          "Brand new iPhone 14 Pro Max, 100% guaranteed, send money first via western union, urgent sale, act now!",
        price: 5000, // Unrealistically low
        category_id: "cat-1",
        subcategory_id: "subcat-1",
        state: "Lagos",
        lga: "Ikeja",
        condition: "new",
        is_boosted: false,
        is_active: true,
        views_count: 0,
        likes_count: 0,
        saves_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = detectScamPatterns(highRiskListing);

      expect(result.is_suspicious).toBe(true);
      expect(shouldAutoFlag(result)).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it("should have scam warning components available", async () => {
      const { ScamWarningBanner } =
        await import("@/components/safety/scam-warning-banner");
      expect(ScamWarningBanner).toBeDefined();
    });
  });

  describe("4. Verification System", () => {
    it("should have phone verification API routes", async () => {
      // Test that the routes exist by checking if they're defined
      const requestRoute =
        await import("@/app/api/verification/phone/request/route");
      const confirmRoute =
        await import("@/app/api/verification/phone/confirm/route");

      expect(requestRoute.POST).toBeDefined();
      expect(confirmRoute.POST).toBeDefined();
    });

    it("should have NIN verification API route", async () => {
      const ninRoute = await import("@/app/api/verification/nin/route");

      expect(ninRoute.POST).toBeDefined();
      expect(ninRoute.GET).toBeDefined();
    });

    it("should have video verification API route", async () => {
      const videoRoute = await import("@/app/api/verification/video/route");

      expect(videoRoute.POST).toBeDefined();
    });

    it("should have verification API utilities", async () => {
      const verificationApi = await import("@/lib/api/verification");

      expect(verificationApi.requestPhoneOTP).toBeDefined();
      expect(verificationApi.confirmPhoneOTP).toBeDefined();
      expect(verificationApi.submitNINVerification).toBeDefined();
      expect(verificationApi.submitVideoVerification).toBeDefined();
      expect(verificationApi.calculateTrustScore).toBeDefined();
      expect(verificationApi.updateUserTrustScore).toBeDefined();
    });

    it("should calculate trust score correctly", async () => {
      const { calculateTrustScore } = await import("@/lib/api/verification");

      // No verification
      expect(
        calculateTrustScore(false, false, false, 0, 0, false),
      ).toBeLessThan(30);

      // Phone only
      expect(
        calculateTrustScore(true, false, false, 0, 0, false),
      ).toBeGreaterThanOrEqual(20);

      // Phone + NIN
      expect(
        calculateTrustScore(true, true, false, 0, 0, false),
      ).toBeGreaterThanOrEqual(60);

      // All verifications
      expect(calculateTrustScore(true, true, true, 0, 0, false)).toBe(100);
    });
  });

  describe("5. Safety Features", () => {
    it("should have phone reveal button component", async () => {
      const { PhoneRevealButton } =
        await import("@/components/safety/phone-reveal-button");
      expect(PhoneRevealButton).toBeDefined();
    });

    it("should have report listing modal component", async () => {
      const { ReportListingModal } =
        await import("@/components/safety/report-listing-modal");
      expect(ReportListingModal).toBeDefined();
    });

    it("should have safety tips component", async () => {
      const { SafetyTips } = await import("@/components/safety/safety-tips");
      expect(SafetyTips).toBeDefined();
    });

    it("should have phone reveal API route", async () => {
      const revealRoute = await import("@/app/api/listings/reveal-phone/route");
      expect(revealRoute.POST).toBeDefined();
    });

    it("should have report listing API route", async () => {
      const reportRoute = await import("@/app/api/listings/report/route");
      expect(reportRoute.POST).toBeDefined();
    });

    it("should have reports table accessible", async () => {
      const { error } = await supabase.from("reports").select("id").limit(1);

      expect(error?.code).not.toBe("42P01");
    });
  });

  describe("6. Message Validation", () => {
    it("should have message validation schema", async () => {
      const { messageSchema } = await import("@/lib/validations/message");
      expect(messageSchema).toBeDefined();

      // Test valid message
      const validMessage = messageSchema.safeParse({
        content: "Hello, is this item still available?",
      });
      expect(validMessage.success).toBe(true);

      // Test message with media
      const messageWithMedia = messageSchema.safeParse({
        content: "Here's a photo",
        media_url: "https://example.com/image.jpg",
      });
      expect(messageWithMedia.success).toBe(true);

      // Test invalid message (too long)
      const invalidMessage = messageSchema.safeParse({
        content: "a".repeat(1001),
      });
      expect(invalidMessage.success).toBe(false);
    });
  });

  describe("7. Notifications System", () => {
    it("should have notifications table accessible", async () => {
      const { error } = await supabase
        .from("notifications")
        .select("id")
        .limit(1);

      expect(error?.code).not.toBe("42P01");
    });

    it("should have notification subscription utilities", async () => {
      const { subscribeToNotifications } =
        await import("@/lib/supabase/realtime");
      expect(subscribeToNotifications).toBeDefined();
    });
  });

  describe("8. Integration Validation", () => {
    it("should have all messaging-related stores initialized", async () => {
      const { useMessagesStore } = await import("@/store/messages");
      const store = useMessagesStore.getState();

      expect(store.conversations).toBeDefined();
      expect(Array.isArray(store.conversations)).toBe(true);
      expect(store.messages).toBeDefined();
      expect(typeof store.messages).toBe("object");
      expect(store.activeConversationId).toBeDefined();
      expect(store.unreadCount).toBeDefined();
      expect(typeof store.unreadCount).toBe("number");
    });

    it("should have verification badge components", async () => {
      const { VerificationBadges } =
        await import("@/components/profile/verification-badge");
      expect(VerificationBadges).toBeDefined();
    });

    it("should have trust score component", async () => {
      const { TrustScore } = await import("@/components/profile/trust-score");
      expect(TrustScore).toBeDefined();
    });
  });
});
