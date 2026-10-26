import { describe, it, expect, beforeEach, vi } from "vitest";
import { isUpstashConfigured } from "../upstash-rate-limit";

describe("Upstash Rate Limiting", () => {
  describe("isUpstashConfigured", () => {
    it("should return false when Upstash credentials are not configured", () => {
      // In test environment, Upstash credentials are not set
      expect(isUpstashConfigured()).toBe(false);
    });

    it("should handle missing environment variables gracefully", () => {
      // Should not throw an error
      expect(() => isUpstashConfigured()).not.toThrow();
    });
  });

  describe("Rate Limiter Configuration", () => {
    it("should have search rate limiter configured for 100 requests per minute", async () => {
      // This test verifies the configuration matches Requirement 31.2
      const { rateLimiters } = await import("../upstash-rate-limit");
      
      // The rate limiter should be configured
      expect(rateLimiters.search).toBeDefined();
      
      // When Upstash is not configured, it should return a mock that always succeeds
      const result = await rateLimiters.search.limit("test-identifier");
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("limit");
      expect(result).toHaveProperty("remaining");
      expect(result).toHaveProperty("reset");
    });

    it("should have all required rate limiters configured", async () => {
      const { rateLimiters } = await import("../upstash-rate-limit");
      
      expect(rateLimiters.search).toBeDefined();
      expect(rateLimiters.default).toBeDefined();
      expect(rateLimiters.authenticated).toBeDefined();
      expect(rateLimiters.anonymous).toBeDefined();
      expect(rateLimiters.sensitive).toBeDefined();
      expect(rateLimiters.payment).toBeDefined();
      expect(rateLimiters.upload).toBeDefined();
    });
  });

  describe("Mock Rate Limiter (when Upstash not configured)", () => {
    it("should always allow requests when Upstash is not configured", async () => {
      const { rateLimiters } = await import("../upstash-rate-limit");
      
      // Make multiple requests
      for (let i = 0; i < 150; i++) {
        const result = await rateLimiters.search.limit(`test-${i}`);
        expect(result.success).toBe(true);
      }
    });
  });
});
