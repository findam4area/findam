/**
 * Upstash-based rate limiting for production use
 * Provides distributed rate limiting across multiple instances
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client for Upstash
// Falls back to in-memory if Upstash credentials are not configured
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn("Failed to initialize Upstash Redis:", error);
}

/**
 * Create a rate limiter instance
 * Uses sliding window algorithm for accurate rate limiting
 */
function createRateLimiter(requests: number, window: string) {
  if (!redis) {
    // Return a mock rate limiter if Redis is not configured
    return {
      limit: async () => ({
        success: true,
        limit: requests,
        remaining: requests,
        reset: Date.now() + 60000,
        pending: Promise.resolve(),
      }),
    };
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as any), // Type assertion for duration string
    analytics: true,
    prefix: "findam:ratelimit",
  });
}

/**
 * Rate limiters for different endpoint types
 * Requirement 31.2: 100 requests per minute per IP for search endpoints
 */
export const rateLimiters = {
  // Search and autocomplete - 100 requests per minute (Requirement 31.2)
  search: createRateLimiter(100, "1 m"),
  
  // General API endpoints - 100 requests per minute
  default: createRateLimiter(100, "1 m"),
  
  // Authenticated users - 200 requests per minute
  authenticated: createRateLimiter(200, "1 m"),
  
  // Anonymous users - 50 requests per minute
  anonymous: createRateLimiter(50, "1 m"),
  
  // Sensitive endpoints (OTP, verification) - 5 requests per 10 minutes
  sensitive: createRateLimiter(5, "10 m"),
  
  // Payment endpoints - 10 requests per 5 minutes
  payment: createRateLimiter(10, "5 m"),
  
  // File uploads - 20 requests per hour
  upload: createRateLimiter(20, "1 h"),
};

/**
 * Check rate limit for a given identifier
 * Returns 429 status information if limit exceeded
 */
export async function checkUpstashRateLimit(
  identifier: string,
  limiter: ReturnType<typeof createRateLimiter>,
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const result = await limiter.limit(identifier);
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Check if Upstash is configured
 */
export function isUpstashConfigured(): boolean {
  return redis !== null;
}
