/**
 * Property-Based Tests for Rate Limiting
 * 
 * Property 20: Rate Limit Error Response
 * Validates: Requirements 31.11
 * 
 * Test that exceeding rate limit returns 429 status code
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { NextRequest } from "next/server";
import { GET as searchGET } from "../route";
import { GET as autocompleteGET } from "../autocomplete/route";

// Mock dependencies
vi.mock("@/lib/typesense/queries", () => ({
  searchListings: vi.fn().mockResolvedValue({
    hits: [],
    estimatedTotalHits: 0,
    processingTimeMs: 10,
  }),
  getAutocompleteSuggestions: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
        ilike: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/services/boost", () => ({
  boostService: {
    getBoostedListings: vi.fn().mockResolvedValue([]),
  },
}));

// Mock rate limit middleware with configurable behavior
let shouldExceedLimit = false;

vi.mock("@/lib/middleware/rate-limit-middleware", () => ({
  createRateLimitMiddleware: vi.fn(() => {
    return async (request: NextRequest) => {
      if (shouldExceedLimit) {
        // Return 429 response when limit exceeded
        return new Response(
          JSON.stringify({
            error: "Too many requests",
            message: "Rate limit exceeded. Please try again later.",
            retryAfter: 60,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "60",
              "X-RateLimit-Limit": "100",
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": new Date(Date.now() + 60000).toISOString(),
            },
          }
        );
      }
      
      return null; // Allow request to proceed
    };
  }),
}));

describe("Rate Limiting - Property-Based Tests", () => {
  beforeEach(() => {
    shouldExceedLimit = false;
  });

  describe("Property 20: Rate Limit Error Response", () => {
    it("should always return 429 status code when rate limit is exceeded for search endpoint", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // query string
          async (query) => {
            shouldExceedLimit = true;

            const request = new NextRequest(
              new URL(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`)
            );

            const response = await searchGET(request);

            // Property: When rate limit is exceeded, status code SHALL be 429
            expect(response.status).toBe(429);
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should always return 429 status code when rate limit is exceeded for autocomplete endpoint", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // query string
          async (query) => {
            shouldExceedLimit = true;

            const request = new NextRequest(
              new URL(`http://localhost:3000/api/search/autocomplete?q=${encodeURIComponent(query)}`)
            );

            const response = await autocompleteGET(request);

            // Property: When rate limit is exceeded, status code SHALL be 429
            expect(response.status).toBe(429);
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should always include required rate limit headers in 429 response", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // query string
          async (query) => {
            shouldExceedLimit = true;

            const request = new NextRequest(
              new URL(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`)
            );

            const response = await searchGET(request);

            // Property: 429 responses SHALL include rate limit headers
            expect(response.status).toBe(429);
            expect(response.headers.get("Retry-After")).toBeTruthy();
            expect(response.headers.get("X-RateLimit-Limit")).toBeTruthy();
            expect(response.headers.get("X-RateLimit-Remaining")).toBeTruthy();
            expect(response.headers.get("X-RateLimit-Reset")).toBeTruthy();
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should always include error message in 429 response body", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // query string
          async (query) => {
            shouldExceedLimit = true;

            const request = new NextRequest(
              new URL(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`)
            );

            const response = await searchGET(request);

            // Property: 429 responses SHALL include error message
            expect(response.status).toBe(429);
            const data = await response.json();
            expect(data).toHaveProperty("error");
            expect(data).toHaveProperty("message");
            expect(data.error).toBe("Too many requests");
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should never return 429 when rate limit is not exceeded", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // query string
          async (query) => {
            shouldExceedLimit = false;

            const request = new NextRequest(
              new URL(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`)
            );

            const response = await searchGET(request);

            // Property: When rate limit is NOT exceeded, status code SHALL NOT be 429
            expect(response.status).not.toBe(429);
            expect(response.status).toBe(200);
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should return consistent 429 response structure across different query parameters", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            q: fc.string({ minLength: 1, maxLength: 100 }),
            category: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
            minPrice: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined }),
            maxPrice: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined }),
          }),
          async (params) => {
            shouldExceedLimit = true;

            const url = new URL("http://localhost:3000/api/search");
            url.searchParams.set("q", params.q);
            if (params.category) url.searchParams.set("category", params.category);
            if (params.minPrice !== undefined) url.searchParams.set("minPrice", params.minPrice.toString());
            if (params.maxPrice !== undefined) url.searchParams.set("maxPrice", params.maxPrice.toString());

            const request = new NextRequest(url);
            const response = await searchGET(request);

            // Property: 429 response structure SHALL be consistent regardless of query parameters
            expect(response.status).toBe(429);
            const data = await response.json();
            expect(data).toMatchObject({
              error: "Too many requests",
              message: expect.any(String),
              retryAfter: expect.any(Number),
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should return 429 with valid Retry-After header value", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // query string
          async (query) => {
            shouldExceedLimit = true;

            const request = new NextRequest(
              new URL(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`)
            );

            const response = await searchGET(request);

            // Property: Retry-After header SHALL contain a valid positive integer
            expect(response.status).toBe(429);
            const retryAfter = response.headers.get("Retry-After");
            expect(retryAfter).toBeTruthy();
            const retryAfterValue = parseInt(retryAfter!, 10);
            expect(retryAfterValue).toBeGreaterThan(0);
            expect(Number.isInteger(retryAfterValue)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should return 429 with X-RateLimit-Remaining set to 0", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // query string
          async (query) => {
            shouldExceedLimit = true;

            const request = new NextRequest(
              new URL(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`)
            );

            const response = await searchGET(request);

            // Property: When rate limit is exceeded, X-RateLimit-Remaining SHALL be 0
            expect(response.status).toBe(429);
            const remaining = response.headers.get("X-RateLimit-Remaining");
            expect(remaining).toBe("0");
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should return 429 with valid ISO 8601 timestamp in X-RateLimit-Reset", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }), // query string
          async (query) => {
            shouldExceedLimit = true;

            const request = new NextRequest(
              new URL(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`)
            );

            const response = await searchGET(request);

            // Property: X-RateLimit-Reset SHALL contain a valid ISO 8601 timestamp
            expect(response.status).toBe(429);
            const reset = response.headers.get("X-RateLimit-Reset");
            expect(reset).toBeTruthy();
            
            // Verify it's a valid ISO 8601 date
            const resetDate = new Date(reset!);
            expect(resetDate.toString()).not.toBe("Invalid Date");
            expect(resetDate.getTime()).toBeGreaterThan(Date.now());
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
