/**
 * Offline API Client
 * Provides offline-first API calls with automatic caching and queue management
 */

import {
  getCachedListings,
  getCachedConversations,
  getCachedMessages,
  cacheListings,
  cacheConversations,
  cacheMessages,
  saveToStore,
  getAllFromStore,
  deleteFromStore,
  STORES,
} from "@/lib/utils/offline-storage";
import { toast } from "sonner";

interface OfflineFetchOptions extends RequestInit {
  skipCache?: boolean;
  queueIfOffline?: boolean;
}

/**
 * Offline-first fetch wrapper
 * Automatically caches GET responses and queues mutations when offline
 */
export async function offlineFetch(
  url: string,
  options: OfflineFetchOptions = {},
): Promise<any> {
  const { skipCache = false, queueIfOffline = true, ...fetchOptions } = options;
  const method = fetchOptions.method || "GET";
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  // Handle offline GET requests
  if (!isOnline && method === "GET") {
    return getCachedData(url);
  }

  // Handle offline mutations
  if (!isOnline && method !== "GET") {
    if (queueIfOffline) {
      await queueRequest(url, fetchOptions);
      throw new Error("Request queued for sync when online");
    } else {
      throw new Error("Cannot perform this action offline");
    }
  }

  // Online request
  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const httpError = new Error(`HTTP error! status: ${response.status}`);
      (httpError as any).isHttpError = true;
      throw httpError;
    }

    const data = await response.json();

    // Cache GET responses
    if (method === "GET" && !skipCache) {
      await cacheResponse(url, data);
    }

    return data;
  } catch (error) {
    // Only fallback to cache on network errors, not HTTP errors
    if (method === "GET" && !(error as any).isHttpError) {
      try {
        const cachedData = await getCachedData(url);
        toast.info("Showing cached data (offline)");
        return cachedData;
      } catch (cacheError) {
        // If cache also fails, throw the original network error
        throw error;
      }
    }
    throw error;
  }
}

/**
 * Get cached data based on URL pattern
 */
async function getCachedData(url: string): Promise<any> {
  if (url.includes("/api/listings")) {
    const cached = await getCachedListings();
    if (cached && cached.length > 0) {
      return cached;
    }
  } else if (url.includes("/api/conversations") && url.includes("/messages")) {
    const conversationId = url.split("/")[3];
    const cached = await getCachedMessages(conversationId);
    if (cached && cached.length > 0) {
      return cached;
    }
  } else if (url.includes("/api/conversations")) {
    const cached = await getCachedConversations();
    if (cached && cached.length > 0) {
      return cached;
    }
  }

  throw new Error("No cached data available offline");
}

/**
 * Cache response based on URL pattern
 */
async function cacheResponse(url: string, data: any): Promise<void> {
  try {
    if (url.includes("/api/listings")) {
      const listings = Array.isArray(data) ? data : data.listings || [];
      if (listings.length > 0) {
        await cacheListings(listings);
      }
    } else if (
      url.includes("/api/conversations") &&
      url.includes("/messages")
    ) {
      const messages = Array.isArray(data) ? data : [];
      if (messages.length > 0) {
        await cacheMessages(messages);
      }
    } else if (url.includes("/api/conversations")) {
      const conversations = Array.isArray(data) ? data : [];
      if (conversations.length > 0) {
        await cacheConversations(conversations);
      }
    }
  } catch (error) {
    console.error("Failed to cache response:", error);
    // Don't throw - caching failure shouldn't break the request
  }
}

/**
 * Queue a request for later sync
 */
async function queueRequest(url: string, options: RequestInit): Promise<void> {
  try {
    await saveToStore(STORES.OFFLINE_QUEUE, {
      url,
      method: options.method || "GET",
      headers: (options.headers as Record<string, string>) || {},
      body: options.body ? String(options.body) : "",
      timestamp: Date.now(),
      retries: 0,
    });
    toast.info("Action queued for sync when online");
  } catch (error) {
    console.error("Failed to queue request:", error);
    throw error;
  }
}

/**
 * Get all queued requests
 */
export async function getQueuedRequests(): Promise<any[]> {
  return await getAllFromStore(STORES.OFFLINE_QUEUE);
}

/**
 * Sync all queued requests
 */
export async function syncQueuedRequests(): Promise<void> {
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  if (!isOnline) {
    return;
  }

  const queue = await getQueuedRequests();

  for (const request of queue) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body || undefined,
      });

      if (response.ok) {
        // Remove from queue on success
        await deleteFromStore(STORES.OFFLINE_QUEUE, request.id);
        toast.success("Synced offline action");
      } else {
        console.error("Failed to sync request:", request);
      }
    } catch (error) {
      console.error("Error syncing request:", error);
      // Keep in queue for retry
    }
  }
}
