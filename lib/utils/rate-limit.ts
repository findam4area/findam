/**
 * Rate limiting utility for API routes
 * Uses in-memory storage for simplicity (consider Redis for production)
 */

export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory storage for rate limits
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with success status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No existing entry or expired - create new
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.interval;
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt,
    });
    return {
      success: true,
      remaining: config.uniqueTokenPerInterval - 1,
      resetAt,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.uniqueTokenPerInterval) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    remaining: config.uniqueTokenPerInterval - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or manual overrides
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig,
): { remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    return {
      remaining: config.uniqueTokenPerInterval,
      resetAt: now + config.interval,
    };
  }

  return {
    remaining: Math.max(0, config.uniqueTokenPerInterval - entry.count),
    resetAt: entry.resetAt,
  };
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // General API endpoints - 100 requests per minute
  DEFAULT: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 100,
  },
  // Authenticated users - 200 requests per minute
  AUTHENTICATED: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 200,
  },
  // Anonymous users - 50 requests per minute
  ANONYMOUS: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 50,
  },
  // Sensitive endpoints (OTP, verification) - 5 requests per 10 minutes
  SENSITIVE: {
    interval: 10 * 60 * 1000,
    uniqueTokenPerInterval: 5,
  },
  // Payment endpoints - 10 requests per 5 minutes
  PAYMENT: {
    interval: 5 * 60 * 1000,
    uniqueTokenPerInterval: 10,
  },
  // Search/autocomplete - 100 requests per minute (Requirement 31.2)
  SEARCH: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 100,
  },
  // File uploads - 20 requests per hour
  UPLOAD: {
    interval: 60 * 60 * 1000,
    uniqueTokenPerInterval: 20,
  },
} as const;
