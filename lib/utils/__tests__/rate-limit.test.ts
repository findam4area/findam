import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  RATE_LIMITS,
} from "../rate-limit";

describe("Rate Limiting", () => {
  const testIdentifier = "test-user-123";

  beforeEach(() => {
    // Reset rate limit before each test
    resetRateLimit(testIdentifier);
  });

  describe("checkRateLimit", () => {
    it("should allow requests within limit", () => {
      const config = { interval: 60000, uniqueTokenPerInterval: 5 };

      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(testIdentifier, config);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it("should block requests exceeding limit", () => {
      const config = { interval: 60000, uniqueTokenPerInterval: 3 };

      // Make 3 successful requests
      for (let i = 0; i < 3; i++) {
        const result = checkRateLimit(testIdentifier, config);
        expect(result.success).toBe(true);
      }

      // 4th request should be blocked
      const result = checkRateLimit(testIdentifier, config);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset after interval expires", () => {
      const config = { interval: 100, uniqueTokenPerInterval: 2 };

      // Use up the limit
      checkRateLimit(testIdentifier, config);
      checkRateLimit(testIdentifier, config);

      // Should be blocked
      let result = checkRateLimit(testIdentifier, config);
      expect(result.success).toBe(false);

      // Wait for interval to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Should be allowed again
          result = checkRateLimit(testIdentifier, config);
          expect(result.success).toBe(true);
          resolve();
        }, 150);
      });
    });

    it("should track different identifiers separately", () => {
      const config = { interval: 60000, uniqueTokenPerInterval: 2 };

      // Use up limit for first identifier
      checkRateLimit("user-1", config);
      checkRateLimit("user-1", config);

      // First identifier should be blocked
      let result = checkRateLimit("user-1", config);
      expect(result.success).toBe(false);

      // Second identifier should still be allowed
      result = checkRateLimit("user-2", config);
      expect(result.success).toBe(true);
    });
  });

  describe("resetRateLimit", () => {
    it("should reset rate limit for identifier", () => {
      const config = { interval: 60000, uniqueTokenPerInterval: 2 };

      // Use up the limit
      checkRateLimit(testIdentifier, config);
      checkRateLimit(testIdentifier, config);

      // Should be blocked
      let result = checkRateLimit(testIdentifier, config);
      expect(result.success).toBe(false);

      // Reset
      resetRateLimit(testIdentifier);

      // Should be allowed again
      result = checkRateLimit(testIdentifier, config);
      expect(result.success).toBe(true);
    });
  });

  describe("getRateLimitStatus", () => {
    it("should return status without incrementing", () => {
      const config = { interval: 60000, uniqueTokenPerInterval: 5 };

      // Check status multiple times
      for (let i = 0; i < 3; i++) {
        const status = getRateLimitStatus(testIdentifier, config);
        expect(status.remaining).toBe(5);
      }

      // Make actual request
      checkRateLimit(testIdentifier, config);

      // Status should now show 4 remaining
      const status = getRateLimitStatus(testIdentifier, config);
      expect(status.remaining).toBe(4);
    });
  });

  describe("RATE_LIMITS presets", () => {
    it("should have correct default configuration", () => {
      expect(RATE_LIMITS.DEFAULT.interval).toBe(60 * 1000);
      expect(RATE_LIMITS.DEFAULT.uniqueTokenPerInterval).toBe(100);
    });

    it("should have stricter limits for sensitive endpoints", () => {
      expect(RATE_LIMITS.SENSITIVE.uniqueTokenPerInterval).toBeLessThan(
        RATE_LIMITS.DEFAULT.uniqueTokenPerInterval,
      );
      expect(RATE_LIMITS.SENSITIVE.interval).toBeGreaterThan(
        RATE_LIMITS.DEFAULT.interval,
      );
    });

    it("should have higher limits for authenticated users", () => {
      expect(RATE_LIMITS.AUTHENTICATED.uniqueTokenPerInterval).toBeGreaterThan(
        RATE_LIMITS.ANONYMOUS.uniqueTokenPerInterval,
      );
    });
  });
});
