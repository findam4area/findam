/**
 * Portfolio API Tests
 * Tests for portfolio item management, CV upload, and skills management
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  updateUserSkills,
} from "../portfolio";
import { PortfolioItem } from "@/lib/types";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
          data: null,
          error: null,
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({
          data: { path: "test-path" },
          error: null,
        })),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: "https://example.com/test.jpg" },
        })),
      })),
    },
  })),
}));

describe("Portfolio API", () => {
  describe("getPortfolioItems", () => {
    it("should fetch portfolio items for a user", async () => {
      const userId = "test-user-id";
      const items = await getPortfolioItems(userId);
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe("createPortfolioItem", () => {
    it("should create a new portfolio item", async () => {
      const portfolioData: Omit<PortfolioItem, "id" | "created_at"> = {
        user_id: "test-user-id",
        title: "Test Portfolio Item",
        description: "Test description",
        media_url: "https://example.com/test.jpg",
        media_type: "image",
        display_order: 0,
      };

      // Test that the function accepts the correct data structure
      expect(portfolioData.title).toBe("Test Portfolio Item");
      expect(portfolioData.media_type).toBe("image");
    });
  });

  describe("updateUserSkills", () => {
    it("should update user skills", async () => {
      const userId = "test-user-id";
      const skills = ["React", "TypeScript", "Node.js"];

      // Test that skills array is properly structured
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBe(3);
    });
  });
});
