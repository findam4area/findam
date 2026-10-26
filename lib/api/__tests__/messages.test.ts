import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createConversation,
  sendMessage,
  getConversationMessages,
  markMessagesAsRead,
} from "../messages";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: "conv-123",
              listing_id: null,
              created_at: new Date().toISOString(),
            },
            error: null,
          })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null,
          })),
        })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({
          error: null,
        })),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: "https://example.com/image.jpg" },
        })),
      })),
    },
  })),
}));

describe("Messages API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a conversation", async () => {
    const conversation = await createConversation(["user1", "user2"]);
    expect(conversation).toBeDefined();
    expect(conversation.id).toBe("conv-123");
  });

  it("should get conversation messages", async () => {
    const messages = await getConversationMessages("conv-123");
    expect(Array.isArray(messages)).toBe(true);
  });

  it("should mark messages as read", async () => {
    await expect(
      markMessagesAsRead("conv-123", "user1"),
    ).resolves.not.toThrow();
  });
});
