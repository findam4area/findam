/**
 * Graceful degradation utilities for handling failures
 * Implements fallback strategies for various failure scenarios
 */

import { trackError, addBreadcrumb } from "./error-tracker";

interface CacheOptions {
  key: string;
  ttl?: number; // Time to live in milliseconds
  storage?: "localStorage" | "sessionStorage" | "memory";
}

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoff?: "linear" | "exponential";
}

// In-memory cache for when localStorage is unavailable
const memoryCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Get cached data with TTL check
 */
export function getCachedData<T>(options: CacheOptions): T | null {
  const { key, ttl = 5 * 60 * 1000, storage = "localStorage" } = options;

  try {
    let cached: string | null = null;

    if (storage === "memory") {
      const entry = memoryCache.get(key);
      if (entry) {
        cached = JSON.stringify(entry);
      }
    } else if (typeof window !== "undefined") {
      const storageObj =
        storage === "localStorage" ? localStorage : sessionStorage;
      cached = storageObj.getItem(key);
    }

    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > ttl) {
      // Cache expired
      removeCachedData(options);
      return null;
    }

    addBreadcrumb({
      message: "Cache hit",
      category: "cache",
      data: { key, age },
    });

    return data as T;
  } catch (error) {
    console.warn("Failed to get cached data:", error);
    return null;
  }
}

/**
 * Check if a cache entry exists (regardless of the value)
 */
export function hasCacheEntry(options: CacheOptions): boolean {
  const { key, ttl = 5 * 60 * 1000, storage = "localStorage" } = options;

  try {
    let cached: string | null = null;

    if (storage === "memory") {
      const entry = memoryCache.get(key);
      if (entry) {
        cached = JSON.stringify(entry);
      }
    } else if (typeof window !== "undefined") {
      const storageObj =
        storage === "localStorage" ? localStorage : sessionStorage;
      cached = storageObj.getItem(key);
    }

    if (!cached) return false;

    const { timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > ttl) {
      // Cache expired
      removeCachedData(options);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Failed to check cache entry:", error);
    return false;
  }
}

/**
 * Set cached data with timestamp
 */
export function setCachedData<T>(data: T, options: CacheOptions): void {
  const { key, storage = "localStorage" } = options;

  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };

    if (storage === "memory") {
      memoryCache.set(key, cacheEntry);
    } else if (typeof window !== "undefined") {
      const storageObj =
        storage === "localStorage" ? localStorage : sessionStorage;
      storageObj.setItem(key, JSON.stringify(cacheEntry));
    }

    addBreadcrumb({
      message: "Data cached",
      category: "cache",
      data: { key },
    });
  } catch (error) {
    console.warn("Failed to cache data:", error);
  }
}

/**
 * Remove cached data
 */
export function removeCachedData(options: CacheOptions): void {
  const { key, storage = "localStorage" } = options;

  try {
    if (storage === "memory") {
      memoryCache.delete(key);
    } else if (typeof window !== "undefined") {
      const storageObj =
        storage === "localStorage" ? localStorage : sessionStorage;
      storageObj.removeItem(key);
    }
  } catch (error) {
    console.warn("Failed to remove cached data:", error);
  }
}

/**
 * Fetch with cache fallback
 * Falls back to cached content when API fails
 */
export async function fetchWithCacheFallback<T>(
  fetchFn: () => Promise<T>,
  cacheOptions: CacheOptions,
): Promise<{ data: T; fromCache: boolean }> {
  try {
    // Try to fetch fresh data
    const data = await fetchFn();

    // Cache the successful response
    setCachedData(data, cacheOptions);

    return { data, fromCache: false };
  } catch (error) {
    // Log the error
    trackError(error as Error, {
      tags: { fallback: "cache" },
      extra: { cacheKey: cacheOptions.key },
    });

    // Try to get cached data - note that getCachedData returns null if not found
    // but could also return null as valid cached data
    const hasCachedData = hasCacheEntry(cacheOptions);
    
    if (hasCachedData) {
      const cachedData = getCachedData<T>(cacheOptions);
      
      addBreadcrumb({
        message: "Using cached data after fetch failure",
        category: "fallback",
        level: "warning",
        data: { cacheKey: cacheOptions.key },
      });

      return { data: cachedData!, fromCache: true };
    }

    // No cache available, rethrow error
    throw error;
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoff = "exponential",
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay =
          backoff === "exponential"
            ? retryDelay * Math.pow(2, attempt)
            : retryDelay * (attempt + 1);

        addBreadcrumb({
          message: `Retry attempt ${attempt + 1}/${maxRetries}`,
          category: "retry",
          data: { delay, error: lastError.message },
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  trackError(lastError!, {
    tags: { retry: "failed" },
    extra: { maxRetries },
  });

  throw lastError;
}

/**
 * Polling fallback for realtime connections
 */
export class PollingFallback {
  private intervalId: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor(
    private pollFn: () => Promise<void>,
    private interval: number = 30000, // 30 seconds default
  ) {}

  start(): void {
    if (this.isPolling) return;

    this.isPolling = true;

    addBreadcrumb({
      message: "Started polling fallback",
      category: "fallback",
      data: { interval: this.interval },
    });

    // Poll immediately
    this.pollFn().catch((error) => {
      console.warn("Polling error:", error);
    });

    // Then poll at intervals
    this.intervalId = setInterval(() => {
      this.pollFn().catch((error) => {
        console.warn("Polling error:", error);
      });
    }, this.interval);
  }

  stop(): void {
    if (!this.isPolling) return;

    this.isPolling = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    addBreadcrumb({
      message: "Stopped polling fallback",
      category: "fallback",
    });
  }

  isActive(): boolean {
    return this.isPolling;
  }
}

/**
 * Image fallback handler
 */
export function getImageFallback(type: "listing" | "avatar" | "category"): string {
  const fallbacks = {
    listing: "/images/placeholder-listing.png",
    avatar: "/images/placeholder-avatar.png",
    category: "/images/placeholder-category.png",
  };

  return fallbacks[type] || "/images/placeholder.png";
}

/**
 * Handle image load error with fallback
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackType: "listing" | "avatar" | "category" = "listing",
): void {
  const img = event.currentTarget;

  // Prevent infinite loop if fallback also fails
  if (img.src.includes("placeholder")) {
    return;
  }

  addBreadcrumb({
    message: "Image load failed, using fallback",
    category: "fallback",
    data: { originalSrc: img.src, fallbackType },
  });

  img.src = getImageFallback(fallbackType);
}

/**
 * Check if feature is available (graceful feature detection)
 */
export function isFeatureAvailable(feature: string): boolean {
  const features: Record<string, () => boolean> = {
    localStorage: () => {
      try {
        const test = "__test__";
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    },
    serviceWorker: () => "serviceWorker" in navigator,
    notifications: () => "Notification" in window,
    webRTC: () => "RTCPeerConnection" in window,
    indexedDB: () => "indexedDB" in window,
  };

  const checker = features[feature];
  if (!checker) return false;

  try {
    return checker();
  } catch {
    return false;
  }
}

/**
 * Execute with partial functionality fallback
 * Attempts to execute critical operations, logs non-critical failures
 */
export async function executeWithPartialFallback<T>(
  criticalOps: Array<() => Promise<any>>,
  nonCriticalOps: Array<() => Promise<any>>,
): Promise<{ success: boolean; criticalResults: any[]; errors: Error[] }> {
  const criticalResults: any[] = [];
  const errors: Error[] = [];

  // Execute critical operations - must succeed
  try {
    for (const op of criticalOps) {
      const result = await op();
      criticalResults.push(result);
    }
  } catch (error) {
    trackError(error as Error, {
      tags: { type: "critical-operation-failed" },
    });
    throw error; // Critical operations must succeed
  }

  // Execute non-critical operations - failures are logged but don't stop execution
  for (const op of nonCriticalOps) {
    try {
      await op();
    } catch (error) {
      errors.push(error as Error);
      trackError(error as Error, {
        tags: { type: "non-critical-operation-failed" },
      });
    }
  }

  return {
    success: true,
    criticalResults,
    errors,
  };
}
