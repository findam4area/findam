import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RateLimitConfig } from "@/lib/utils/rate-limit";
import { checkUpstashRateLimit, isUpstashConfigured, rateLimiters } from "@/lib/utils/upstash-rate-limit";

/**
 * Get client identifier for rate limiting
 * Uses IP address or user ID if authenticated
 */
function getClientIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  return `ip:${ip}`;
}

/**
 * Rate limit middleware factory
 * Uses Upstash if configured, falls back to in-memory
 * Returns a middleware function that checks rate limits
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (
    request: NextRequest,
    userId?: string,
  ): Promise<NextResponse | null> => {
    const identifier = getClientIdentifier(request, userId);
    
    // Use Upstash if configured, otherwise fall back to in-memory
    if (isUpstashConfigured()) {
      // Map config to appropriate Upstash rate limiter
      let limiter = rateLimiters.default;
      
      // Determine which limiter to use based on config
      if (config.uniqueTokenPerInterval === 100 && config.interval === 60000) {
        limiter = rateLimiters.search; // Search endpoints
      } else if (config.uniqueTokenPerInterval === 200 && config.interval === 60000) {
        limiter = rateLimiters.authenticated;
      } else if (config.uniqueTokenPerInterval === 50 && config.interval === 60000) {
        limiter = rateLimiters.anonymous;
      } else if (config.uniqueTokenPerInterval === 5 && config.interval === 600000) {
        limiter = rateLimiters.sensitive;
      } else if (config.uniqueTokenPerInterval === 10 && config.interval === 300000) {
        limiter = rateLimiters.payment;
      } else if (config.uniqueTokenPerInterval === 20 && config.interval === 3600000) {
        limiter = rateLimiters.upload;
      }
      
      const result = await checkUpstashRateLimit(identifier, limiter);
      
      if (!result.success) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

        return NextResponse.json(
          {
            error: "Too many requests",
            message: "Rate limit exceeded. Please try again later.",
            retryAfter,
          },
          {
            status: 429,
            headers: {
              "Retry-After": retryAfter.toString(),
              "X-RateLimit-Limit": result.limit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": new Date(result.reset).toISOString(),
            },
          },
        );
      }
      
      return null;
    }
    
    // Fall back to in-memory rate limiting
    const result = checkRateLimit(identifier, config);

    if (!result.success) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": config.uniqueTokenPerInterval.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
          },
        },
      );
    }

    // Rate limit passed - return null to continue
    return null;
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetAt: number,
  limit: number,
): NextResponse {
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", new Date(resetAt).toISOString());
  return response;
}
