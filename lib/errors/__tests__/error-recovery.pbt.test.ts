/**
 * Property-Based Tests for Error Recovery
 * 
 * Property 19: Error Recovery Property
 * Validates: Requirements 19.10
 * 
 * Test that retrying failed operations attempts recovery
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { retryWithBackoff, fetchWithCacheFallback } from "../graceful-degradation";

describe("Property 19: Error Recovery Property", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should attempt recovery when retrying failed operations", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // maxRetries
        fc.integer({ min: 100, max: 1000 }), // retryDelay
        async (maxRetries, retryDelay) => {
          let attemptCount = 0;
          const mockOperation = vi.fn(async () => {
            attemptCount++;
            if (attemptCount <= maxRetries) {
              throw new Error(`Attempt ${attemptCount} failed`);
            }
            return "success";
          });

          // Should eventually succeed after retries
          const result = await retryWithBackoff(mockOperation, {
            maxRetries,
            retryDelay: 10, // Use short delay for tests
            backoff: "linear",
          });

          // Verify recovery was attempted
          expect(result).toBe("success");
          expect(attemptCount).toBe(maxRetries + 1);
          expect(mockOperation).toHaveBeenCalledTimes(maxRetries + 1);
        }
      ),
      { numRuns: 20 }
    );
  });

  it("should respect maxRetries limit and throw after exhausting retries", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }), // maxRetries
        async (maxRetries) => {
          let attemptCount = 0;
          const mockOperation = vi.fn(async () => {
            attemptCount++;
            throw new Error(`Attempt ${attemptCount} failed`);
          });

          // Should throw after maxRetries
          await expect(
            retryWithBackoff(mockOperation, {
              maxRetries,
              retryDelay: 10,
            })
          ).rejects.toThrow();

          // Verify it tried maxRetries + 1 times (initial + retries)
          expect(attemptCount).toBe(maxRetries + 1);
        }
      ),
      { numRuns: 20 }
    );
  });

  it("should use exponential backoff correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 4 }), // maxRetries
        fc.integer({ min: 100, max: 500 }), // baseDelay
        async (maxRetries, baseDelay) => {
          const delays: number[] = [];
          let attemptCount = 0;

          const mockOperation = vi.fn(async () => {
            attemptCount++;
            if (attemptCount <= maxRetries) {
              throw new Error(`Attempt ${attemptCount} failed`);
            }
            return "success";
          });

          // Mock setTimeout to capture delays
          const originalSetTimeout = global.setTimeout;
          global.setTimeout = ((fn: any, delay: number) => {
            if (delay > 0) {
              delays.push(delay);
            }
            return originalSetTimeout(fn, 0); // Execute immediately for tests
          }) as any;

          try {
            await retryWithBackoff(mockOperation, {
              maxRetries,
              retryDelay: baseDelay,
              backoff: "exponential",
            });

            // Verify exponential backoff pattern
            for (let i = 0; i < delays.length; i++) {
              const expectedDelay = baseDelay * Math.pow(2, i);
              expect(delays[i]).toBe(expectedDelay);
            }
          } finally {
            global.setTimeout = originalSetTimeout;
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it("should fall back to cache when fetch fails", async () => {
    // Skip if localStorage is not available
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // cache key
        fc.jsonValue(), // cached data
        async (cacheKey, cachedData) => {
          // Pre-populate cache
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              data: cachedData,
              timestamp: Date.now(),
            })
          );

          const mockFetch = vi.fn(async () => {
            throw new Error("Network error");
          });

          // Should return cached data when fetch fails
          const result = await fetchWithCacheFallback(mockFetch, {
            key: cacheKey,
            ttl: 60000,
          });

          expect(result.fromCache).toBe(true);
          expect(result.data).toEqual(cachedData);

          // Cleanup
          localStorage.removeItem(cacheKey);
        }
      ),
      { numRuns: 20 }
    );
  });

  it("should cache successful responses for future fallback", async () => {
    // Skip if localStorage is not available
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // cache key
        fc.jsonValue(), // response data
        async (cacheKey, responseData) => {
          const mockFetch = vi.fn(async () => responseData);

          // First call should fetch and cache
          const result1 = await fetchWithCacheFallback(mockFetch, {
            key: cacheKey,
            ttl: 60000,
          });

          expect(result1.fromCache).toBe(false);
          expect(result1.data).toEqual(responseData);
          expect(mockFetch).toHaveBeenCalledTimes(1);

          // Verify data was cached
          const cached = localStorage.getItem(cacheKey);
          expect(cached).toBeTruthy();
          if (cached) {
            const { data } = JSON.parse(cached);
            expect(data).toEqual(responseData);
          }

          // Cleanup
          localStorage.removeItem(cacheKey);
        }
      ),
      { numRuns: 20 }
    );
  });

  it("should handle immediate success without retries", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.jsonValue(), // return value
        async (returnValue) => {
          let attemptCount = 0;
          const mockOperation = vi.fn(async () => {
            attemptCount++;
            return returnValue;
          });

          const result = await retryWithBackoff(mockOperation, {
            maxRetries: 3,
            retryDelay: 100,
          });

          // Should succeed on first attempt
          expect(result).toEqual(returnValue);
          expect(attemptCount).toBe(1);
          expect(mockOperation).toHaveBeenCalledTimes(1);
        }
      ),
      { numRuns: 20 }
    );
  });

  it("should handle partial failures (some retries succeed)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }), // failuresBeforeSuccess
        fc.integer({ min: 1, max: 5 }), // maxRetries
        async (failuresBeforeSuccess, maxRetries) => {
          // Only test cases where we have enough retries
          fc.pre(failuresBeforeSuccess <= maxRetries);

          let attemptCount = 0;
          const mockOperation = vi.fn(async () => {
            attemptCount++;
            if (attemptCount <= failuresBeforeSuccess) {
              throw new Error(`Attempt ${attemptCount} failed`);
            }
            return "recovered";
          });

          const result = await retryWithBackoff(mockOperation, {
            maxRetries,
            retryDelay: 10,
          });

          // Should recover after specified failures
          expect(result).toBe("recovered");
          expect(attemptCount).toBe(failuresBeforeSuccess + 1);
        }
      ),
      { numRuns: 20 }
    );
  });

  it("should preserve error information when all retries fail", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }), // error message
        fc.integer({ min: 1, max: 3 }), // maxRetries
        async (errorMessage, maxRetries) => {
          const mockOperation = vi.fn(async () => {
            throw new Error(errorMessage);
          });

          try {
            await retryWithBackoff(mockOperation, {
              maxRetries,
              retryDelay: 10,
            });
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            // Should preserve original error message
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe(errorMessage);
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
