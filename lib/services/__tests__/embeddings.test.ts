/**
 * Tests for Embeddings Service
 * Requirements: 22.2, 22.6, 22.7, 22.8
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateEmbedding,
  generateListingEmbedding,
  generateUserEmbedding,
  getCacheStats,
  clearExpiredCache,
} from "../embeddings";

// Mock environment variable
vi.stubEnv("OPENAI_API_KEY", "test-api-key");

// Mock OpenAI
vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      embeddings = {
        create: vi.fn().mockResolvedValue({
          data: [
            {
              embedding: Array(1536).fill(0.1), // Mock 1536-dimensional embedding
            },
          ],
        }),
      };
    },
  };
});

describe("Embeddings Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateEmbedding", () => {
    it("should generate embedding for valid text", async () => {
      const text = "Test listing title and description";
      const embedding = await generateEmbedding(text);

      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(1536);
      expect(Array.isArray(embedding)).toBe(true);
    });

    it("should throw error for empty text", async () => {
      await expect(generateEmbedding("")).rejects.toThrow(
        "Text cannot be empty",
      );
    });

    it("should cache embeddings by default", async () => {
      const text = "Test caching";

      // First call
      await generateEmbedding(text);

      // Second call should use cache
      const embedding = await generateEmbedding(text);

      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(1536);
    });

    it("should skip cache when useCache is false", async () => {
      const text = "Test no cache";

      const embedding1 = await generateEmbedding(text, false);
      const embedding2 = await generateEmbedding(text, false);

      expect(embedding1).toBeDefined();
      expect(embedding2).toBeDefined();
    });
  });

  describe("generateListingEmbedding", () => {
    it("should generate embedding from title and description", async () => {
      const title = "iPhone 15 Pro Max";
      const description = "Brand new, 256GB, Space Black";

      const embedding = await generateListingEmbedding(title, description);

      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(1536);
    });

    it("should handle empty description", async () => {
      const title = "Test Product";
      const description = "";

      const embedding = await generateListingEmbedding(title, description);

      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(1536);
    });
  });

  describe("generateUserEmbedding", () => {
    it("should generate embedding from browsing history", async () => {
      const listingTexts = [
        "iPhone 15 Pro\nLatest smartphone",
        "MacBook Pro\nPowerful laptop",
        "AirPods Pro\nWireless earbuds",
      ];

      const embedding = await generateUserEmbedding(listingTexts);

      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(1536);
    });

    it("should throw error for empty history", async () => {
      await expect(generateUserEmbedding([])).rejects.toThrow(
        "Cannot generate user embedding from empty history",
      );
    });

    it("should limit to last 10 listings", async () => {
      const listingTexts = Array(15)
        .fill(0)
        .map((_, i) => `Listing ${i}\nDescription ${i}`);

      const embedding = await generateUserEmbedding(listingTexts);

      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(1536);
    });
  });

  describe("Cache Management", () => {
    it("should track cache statistics", async () => {
      const text1 = "Test 1";
      const text2 = "Test 2";

      await generateEmbedding(text1);
      await generateEmbedding(text2);

      const stats = getCacheStats();

      expect(stats.size).toBeGreaterThan(0);
      expect(stats.validEntries).toBeGreaterThan(0);
    });

    it("should clear expired cache entries", () => {
      clearExpiredCache();

      const stats = getCacheStats();
      expect(stats.expiredEntries).toBe(0);
    });
  });
});
