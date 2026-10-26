/**
 * Offline Storage Utilities
 * Provides IndexedDB and localStorage utilities for offline data persistence
 */

import { openDB as idbOpenDB, DBSchema, IDBPDatabase } from "idb";

// Store names
export const STORES = {
  PREFERENCES: "preferences",
  OFFLINE_QUEUE: "offline-queue",
  LISTINGS: "cached-listings",
  SAVED_LISTINGS: "saved-listings",
  SESSION_STATE: "session-state",
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
} as const;

// IndexedDB Schema
interface FindAmDB extends DBSchema {
  preferences: {
    key: string;
    value: any;
  };
  "offline-queue": {
    key: number;
    value: {
      id?: number;
      url: string;
      method: string;
      headers: Record<string, string>;
      body: string;
      timestamp: number;
      retries?: number;
    };
  };
  "cached-listings": {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
  "saved-listings": {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
  "session-state": {
    key: string;
    value: any;
  };
}

let dbInstance: IDBPDatabase<FindAmDB> | null = null;

// Type for store names only
type StoreNames =
  | "preferences"
  | "offline-queue"
  | "cached-listings"
  | "saved-listings"
  | "session-state";

/**
 * Open IndexedDB database
 * Exported for testing purposes
 */
export async function openDatabase(): Promise<IDBPDatabase<FindAmDB>> {
  return await idbOpenDB<FindAmDB>("findam-offline", 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains("preferences")) {
        db.createObjectStore("preferences");
      }

      if (!db.objectStoreNames.contains("offline-queue")) {
        db.createObjectStore("offline-queue", {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains("cached-listings")) {
        db.createObjectStore("cached-listings", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("saved-listings")) {
        db.createObjectStore("saved-listings", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("session-state")) {
        db.createObjectStore("session-state");
      }
    },
  });
}

/**
 * Initialize and get IndexedDB instance
 */
export async function getDB(): Promise<IDBPDatabase<FindAmDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDatabase();

  return dbInstance;
}

// Alias for tests
export const openDB = openDatabase;

/**
 * Save a preference to IndexedDB
 */
export async function savePreference<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDB();
    await db.put("preferences", value, key);
  } catch (error) {
    console.error("Failed to save preference:", error);
    // Fallback to localStorage
    try {
      localStorage.setItem(`pref_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  }
}

/**
 * Get a preference from IndexedDB
 */
export async function getPreference<T>(key: string): Promise<T | undefined> {
  try {
    const db = await getDB();
    return await db.get("preferences", key);
  } catch (error) {
    console.error("Failed to get preference:", error);
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`pref_${key}`);
      return stored ? JSON.parse(stored) : undefined;
    } catch (e) {
      console.error("Failed to get from localStorage:", e);
      return undefined;
    }
  }
}

/**
 * Delete a preference from IndexedDB
 */
export async function deletePreference(key: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete("preferences", key);
  } catch (error) {
    console.error("Failed to delete preference:", error);
    // Fallback to localStorage
    try {
      localStorage.removeItem(`pref_${key}`);
    } catch (e) {
      console.error("Failed to delete from localStorage:", e);
    }
  }
}

/**
 * Queue an offline action for later sync
 */
export async function queueOfflineAction(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: any,
): Promise<void> {
  try {
    const db = await getDB();
    await db.add("offline-queue", {
      url,
      method,
      headers,
      body: JSON.stringify(body),
      timestamp: Date.now(),
      retries: 0,
    });
  } catch (error) {
    console.error("Failed to queue offline action:", error);
  }
}

/**
 * Get all queued offline actions
 */
export async function getQueuedActions() {
  try {
    const db = await getDB();
    return await db.getAll("offline-queue");
  } catch (error) {
    console.error("Failed to get queued actions:", error);
    return [];
  }
}

/**
 * Remove an action from the offline queue
 */
export async function removeQueuedAction(id: number): Promise<void> {
  try {
    const db = await getDB();
    await db.delete("offline-queue", id);
  } catch (error) {
    console.error("Failed to remove queued action:", error);
  }
}

/**
 * Update retry count for a queued action
 */
export async function updateActionRetries(id: number): Promise<void> {
  try {
    const db = await getDB();
    const action = await db.get("offline-queue", id);
    if (action) {
      action.retries = (action.retries || 0) + 1;
      await db.put("offline-queue", action);
    }
  } catch (error) {
    console.error("Failed to update action retries:", error);
  }
}

/**
 * Clear all queued actions
 */
export async function clearQueuedActions(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear("offline-queue");
  } catch (error) {
    console.error("Failed to clear queued actions:", error);
  }
}

/**
 * Cache a listing for offline access
 */
export async function cacheListing(id: string, data: any): Promise<void> {
  try {
    const db = await getDB();
    await db.put("cached-listings", {
      id,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Failed to cache listing:", error);
  }
}

/**
 * Get a cached listing
 */
export async function getCachedListing(id: string): Promise<any | undefined> {
  try {
    const db = await getDB();
    const cached = await db.get("cached-listings", id);
    return cached?.data;
  } catch (error) {
    console.error("Failed to get cached listing:", error);
    return undefined;
  }
}

/**
 * Save a listing for offline access
 */
export async function saveListing(id: string, data: any): Promise<void> {
  try {
    const db = await getDB();
    await db.put("saved-listings", {
      id,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Failed to save listing:", error);
  }
}

/**
 * Get all saved listings
 */
export async function getSavedListings(): Promise<any[]> {
  try {
    const db = await getDB();
    const saved = await db.getAll("saved-listings");
    return saved.map((item) => item.data);
  } catch (error) {
    console.error("Failed to get saved listings:", error);
    return [];
  }
}

/**
 * Remove a saved listing
 */
export async function removeSavedListing(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete("saved-listings", id);
  } catch (error) {
    console.error("Failed to remove saved listing:", error);
  }
}

/**
 * Save session state
 */
export async function saveSessionState(key: string, value: any): Promise<void> {
  try {
    const db = await getDB();
    await db.put("session-state", value, key);
  } catch (error) {
    console.error("Failed to save session state:", error);
  }
}

/**
 * Get session state
 */
export async function getSessionState<T>(key: string): Promise<T | undefined> {
  try {
    const db = await getDB();
    return await db.get("session-state", key);
  } catch (error) {
    console.error("Failed to get session state:", error);
    return undefined;
  }
}

/**
 * Clear session state
 */
export async function clearSessionState(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear("session-state");
  } catch (error) {
    console.error("Failed to clear session state:", error);
  }
}

/**
 * Clean up old cached data (older than 7 days)
 */
export async function cleanupOldCache(): Promise<void> {
  try {
    const db = await getDB();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Clean cached listings
    const cachedListings = await db.getAll("cached-listings");
    for (const item of cachedListings) {
      if (item.timestamp < sevenDaysAgo) {
        await db.delete("cached-listings", item.id);
      }
    }

    // Clean old queued actions (older than 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const queuedActions = await db.getAll("offline-queue");
    for (const action of queuedActions) {
      if (action.timestamp < thirtyDaysAgo || (action.retries || 0) > 5) {
        await db.delete("offline-queue", action.id!);
      }
    }
  } catch (error) {
    console.error("Failed to cleanup old cache:", error);
  }
}

/**
 * Clear a specific store
 */
export async function clearStore(storeName: StoreNames): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(storeName);
    console.log(`Cleared store: ${storeName}`);
  } catch (error) {
    console.error(`Failed to clear store ${storeName}:`, error);
  }
}

/**
 * Check if we're currently online
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/**
 * Check if cached data is stale (older than 24 hours)
 * Requirement 17.8
 */
export function isDataStale(timestamp: number): boolean {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  return timestamp < twentyFourHoursAgo;
}

/**
 * Get cache age in hours
 */
export function getCacheAgeInHours(timestamp: number): number {
  return (Date.now() - timestamp) / (1000 * 60 * 60);
}

/**
 * Get cache age in days
 */
export function getCacheAgeInDays(timestamp: number): number {
  return Math.floor(getCacheAgeInHours(timestamp) / 24);
}

/**
 * LocalStorage utilities (for preferences fallback)
 */
export const localStorageUtils = {
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to set localStorage:", error);
    }
  },

  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Failed to get localStorage:", error);
      return null;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to remove localStorage:", error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  },
};

/**
 * Generic save to store function
 */
export async function saveToStore(
  storeName: StoreNames,
  data: any | any[],
): Promise<void> {
  try {
    const db = await getDB();
    const items = Array.isArray(data) ? data : [data];

    for (const item of items) {
      await db.put(storeName, item);
    }
  } catch (error) {
    console.error(`Failed to save to store ${storeName}:`, error);
    throw error;
  }
}

/**
 * Generic get from store function
 */
export async function getFromStore<T>(
  storeName: StoreNames,
  key: string,
): Promise<T | undefined> {
  try {
    const db = await getDB();
    return await db.get(storeName, key);
  } catch (error) {
    console.error(`Failed to get from store ${storeName}:`, error);
    return undefined;
  }
}

/**
 * Generic get all from store function
 */
export async function getAllFromStore<T>(storeName: StoreNames): Promise<T[]> {
  try {
    const db = await getDB();
    return await db.getAll(storeName);
  } catch (error) {
    console.error(`Failed to get all from store ${storeName}:`, error);
    return [];
  }
}

/**
 * Generic delete from store function
 */
export async function deleteFromStore(
  storeName: StoreNames,
  key: string | number,
): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(storeName, key);
  } catch (error) {
    console.error(`Failed to delete from store ${storeName}:`, error);
  }
}

/**
 * Query by index
 */
export async function queryByIndex<T>(
  storeName: StoreNames,
  indexName: string,
  query: any,
): Promise<T[]> {
  try {
    const db = await getDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    // Get all items and filter manually since we don't have indexes defined
    const allItems = await store.getAll();
    return allItems.filter((item: any) => item[indexName] === query) as T[];
  } catch (error) {
    console.error(`Failed to query by index in store ${storeName}:`, error);
    return [];
  }
}

/**
 * Cache listings
 */
export async function cacheListings(listings: any[]): Promise<void> {
  try {
    const db = await getDB();
    for (const listing of listings) {
      await db.put("cached-listings", {
        id: listing.id,
        data: listing,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error("Failed to cache listings:", error);
  }
}

/**
 * Get cached listings
 */
export async function getCachedListings(): Promise<any[]> {
  try {
    const db = await getDB();
    const cached = await db.getAll("cached-listings");
    return cached.map((item) => item.data);
  } catch (error) {
    console.error("Failed to get cached listings:", error);
    return [];
  }
}

/**
 * Get cached listings with metadata (includes timestamp)
 */
export async function getCachedListingsWithMetadata(): Promise<
  Array<{ id: string; data: any; timestamp: number }>
> {
  try {
    const db = await getDB();
    return await db.getAll("cached-listings");
  } catch (error) {
    console.error("Failed to get cached listings with metadata:", error);
    return [];
  }
}

/**
 * Get the oldest cache timestamp from cached listings
 */
export async function getOldestCacheTimestamp(): Promise<number | null> {
  try {
    const cached = await getCachedListingsWithMetadata();
    if (cached.length === 0) {
      return null;
    }
    return Math.min(...cached.map((item) => item.timestamp));
  } catch (error) {
    console.error("Failed to get oldest cache timestamp:", error);
    return null;
  }
}

/**
 * Cache conversations
 */
export async function cacheConversations(conversations: any[]): Promise<void> {
  try {
    const db = await getDB();
    // Use session-state store for conversations
    for (const conversation of conversations) {
      await db.put(
        "session-state",
        conversation,
        `conversation_${conversation.id}`,
      );
    }
  } catch (error) {
    console.error("Failed to cache conversations:", error);
  }
}

/**
 * Get cached conversations
 */
export async function getCachedConversations(): Promise<any[]> {
  try {
    const db = await getDB();
    const allKeys = await db.getAllKeys("session-state");
    const conversations = [];

    for (const key of allKeys) {
      if (typeof key === "string" && key.startsWith("conversation_")) {
        const conversation = await db.get("session-state", key);
        if (conversation) {
          conversations.push(conversation);
        }
      }
    }

    return conversations;
  } catch (error) {
    console.error("Failed to get cached conversations:", error);
    return [];
  }
}

/**
 * Cache messages
 */
export async function cacheMessages(messages: any[]): Promise<void> {
  try {
    const db = await getDB();
    // Use session-state store for messages
    for (const message of messages) {
      await db.put("session-state", message, `message_${message.id}`);
    }
  } catch (error) {
    console.error("Failed to cache messages:", error);
  }
}

/**
 * Get cached messages for a conversation
 */
export async function getCachedMessages(
  conversationId: string,
): Promise<any[]> {
  try {
    const db = await getDB();
    const allKeys = await db.getAllKeys("session-state");
    const messages = [];

    for (const key of allKeys) {
      if (typeof key === "string" && key.startsWith("message_")) {
        const message = await db.get("session-state", key);
        if (message && message.conversation_id === conversationId) {
          messages.push(message);
        }
      }
    }

    return messages;
  } catch (error) {
    console.error("Failed to get cached messages:", error);
    return [];
  }
}
