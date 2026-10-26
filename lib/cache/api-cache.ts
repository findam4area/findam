import { NextRequest, NextResponse } from "next/server";
import { CacheService } from "./redis";

/**
 * API response caching middleware
 * Requirements: Performance optimization
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: NextRequest) => string;
  skipCache?: (req: NextRequest) => boolean;
}

/**
 * Wrap API handler with caching
 */
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CacheOptions = {},
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Skip cache for non-GET requests
    if (req.method !== "GET") {
      return handler(req);
    }

    // Skip cache if condition met
    if (options.skipCache && options.skipCache(req)) {
      return handler(req);
    }

    // Generate cache key
    const cacheKey = options.keyGenerator
      ? options.keyGenerator(req)
      : generateDefaultCacheKey(req);

    // Try to get from cache
    const cached = await CacheService.get<{
      status: number;
      headers: Record<string, string>;
      body: any;
    }>(cacheKey);

    if (cached) {
      // Return cached response
      return new NextResponse(JSON.stringify(cached.body), {
        status: cached.status,
        headers: {
          ...cached.headers,
          "X-Cache": "HIT",
        },
      });
    }

    // Execute handler
    const response = await handler(req);

    // Cache successful responses
    if (response.status === 200) {
      const body = await response.json();
      const headers: Record<string, string> = {};

      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      await CacheService.set(
        cacheKey,
        {
          status: response.status,
          headers,
          body,
        },
        options.ttl,
      );

      // Return response with cache miss header
      return new NextResponse(JSON.stringify(body), {
        status: response.status,
        headers: {
          ...headers,
          "X-Cache": "MISS",
        },
      });
    }

    return response;
  };
}

/**
 * Generate default cache key from request
 */
function generateDefaultCacheKey(req: NextRequest): string {
  const url = new URL(req.url);
  const path = url.pathname;
  const params = url.searchParams.toString();

  return `api:${path}${params ? `:${params}` : ""}`;
}

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  /**
   * Invalidate listing-related caches
   */
  async invalidateListing(listingId: string) {
    await CacheService.invalidateResource("listing", listingId);
    await CacheService.deletePattern("api:/api/listings*");
    await CacheService.deletePattern("feed:*");
    await CacheService.deletePattern("search:*");
  },

  /**
   * Invalidate user-related caches
   */
  async invalidateUser(userId: string) {
    await CacheService.invalidateResource("user", userId);
    await CacheService.deletePattern("api:/api/users*");
  },

  /**
   * Invalidate storefront caches
   */
  async invalidateStorefront(username: string) {
    await CacheService.delete(`storefront:${username}`);
    await CacheService.deletePattern(`api:/api/storefront/${username}*`);
  },

  /**
   * Invalidate search caches
   */
  async invalidateSearch() {
    await CacheService.deletePattern("search:*");
    await CacheService.deletePattern("api:/api/search*");
  },

  /**
   * Invalidate feed caches
   */
  async invalidateFeed(userId?: string) {
    if (userId) {
      await CacheService.deletePattern(`feed:${userId}:*`);
    } else {
      await CacheService.deletePattern("feed:*");
    }
  },
};
