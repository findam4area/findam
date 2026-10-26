import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  likeListing,
  unlikeListing,
  hasLikedListing,
  saveListing,
  unsaveListing,
  hasSavedListing,
  getSavedListings,
  generateShareLink,
  generateWhatsAppShareLink,
} from "../interactions";
import type { Listing } from "@/lib/types";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "user_likes" || table === "user_saves") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: null,
                  error: { code: "PGRST116" },
                })),
              })),
            })),
          })),
          insert: vi.fn(() =>
            Promise.resolve({
              error: null,
            }),
          ),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  error: null,
                }),
              ),
            })),
          })),
        };
      }
      if (table === "listings") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: "listing-123",
                    title: "Test Listing",
                    price: 5000,
                    likes_count: 5,
                    saves_count: 3,
                    user_id: "user-456",
                  },
                  error: null,
                }),
              ),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                error: null,
              }),
            ),
          })),
        };
      }
      if (table === "notifications") {
        return {
          insert: vi.fn(() =>
            Promise.resolve({
              error: null,
            }),
          ),
        };
      }
      return {};
    }),
    rpc: vi.fn(() =>
      Promise.resolve({
        error: null,
      }),
    ),
  })),
}));

describe("Interactions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Like functionality", () => {
    it("should like a listing", async () => {
      await expect(
        likeListing("listing-123", "user-123"),
      ).resolves.not.toThrow();
    });

    it("should unlike a listing", async () => {
      await expect(
        unlikeListing("listing-123", "user-123"),
      ).resolves.not.toThrow();
    });

    it("should check if listing is liked", async () => {
      const isLiked = await hasLikedListing("listing-123", "user-123");
      expect(typeof isLiked).toBe("boolean");
    });
  });

  describe("Save functionality", () => {
    it("should save a listing", async () => {
      await expect(
        saveListing("listing-123", "user-123"),
      ).resolves.not.toThrow();
    });

    it("should unsave a listing", async () => {
      await expect(
        unsaveListing("listing-123", "user-123"),
      ).resolves.not.toThrow();
    });

    it("should check if listing is saved", async () => {
      const isSaved = await hasSavedListing("listing-123", "user-123");
      expect(typeof isSaved).toBe("boolean");
    });
  });

  describe("Share functionality", () => {
    it("should generate share link", async () => {
      const shareLink = await generateShareLink("listing-123");
      expect(shareLink).toContain("listing-123");
      expect(shareLink).toContain("/listings/");
    });

    it("should generate WhatsApp share link", async () => {
      const whatsappLink = await generateWhatsAppShareLink("listing-123");
      expect(whatsappLink).toContain("wa.me");
      expect(whatsappLink).toContain("listing-123");
    });
  });
});
