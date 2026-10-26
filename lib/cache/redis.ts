import { createClient } from "redis";

/**
 * Redis client for caching frequently accessed data
 * Requirements: Performance optimization
 */

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error("Redis connection failed after 10 retries");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      console.log("Redis Client Connected");
    });

    await redisClient.connect();
  }

  return redisClient;
}

/**
 * Cache wrapper with automatic serialization
 */
export class CacheService {
  private static DEFAULT_TTL = 3600; // 1 hour in seconds

  /**
   * Get cached value
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const client = await getRedisClient();
      const value = await client.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  static async set(
    key: string,
    value: any,
    ttl: number = CacheService.DEFAULT_TTL,
  ): Promise<boolean> {
    try {
      const client = await getRedisClient();
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  static async delete(key: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  static async deletePattern(pattern: string): Promise<number> {
    try {
      const client = await getRedisClient();
      const keys = await client.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      await client.del(keys);
      return keys.length;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CacheService.DEFAULT_TTL,
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await fetchFn();

    // Cache the result
    await this.set(key, fresh, ttl);

    return fresh;
  }

  /**
   * Invalidate cache for a specific resource
   */
  static async invalidateResource(
    resource: string,
    id?: string,
  ): Promise<void> {
    const patterns = [
      `${resource}:*`,
      `${resource}:list:*`,
      id ? `${resource}:${id}` : null,
    ].filter(Boolean) as string[];

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }
  }
}

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  listing: (id: string) => `listing:${id}`,
  listingList: (filters: string) => `listing:list:${filters}`,
  user: (id: string) => `user:${id}`,
  userProfile: (username: string) => `user:profile:${username}`,
  category: (id: string) => `category:${id}`,
  categoryList: () => `category:list`,
  searchResults: (query: string, filters: string) =>
    `search:${query}:${filters}`,
  analytics: (userId: string, period: string) =>
    `analytics:${userId}:${period}`,
  storefront: (username: string) => `storefront:${username}`,
  feed: (userId: string, page: number) => `feed:${userId}:${page}`,
};

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
