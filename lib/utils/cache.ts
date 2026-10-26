/**
 * Caching utilities for performance optimization
 * Implements multiple caching strategies: Memory, LocalStorage, and IndexedDB
 */

// Memory cache for fast access
const memoryCache = new Map<
  string,
  { data: any; timestamp: number; ttl: number }
>();

/**
 * Memory cache - fastest but cleared on page reload
 */
export const MemoryCache = {
  set(key: string, data: any, ttl: number = 5 * 60 * 1000) {
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  },

  get<T>(key: string): T | null {
    const cached = memoryCache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      memoryCache.delete(key);
      return null;
    }

    return cached.data as T;
  },

  delete(key: string) {
    memoryCache.delete(key);
  },

  clear() {
    memoryCache.clear();
  },
};

/**
 * LocalStorage cache - persists across sessions, limited to ~5-10MB
 */
export const LocalStorageCache = {
  set(key: string, data: any, ttl: number = 60 * 60 * 1000) {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error("LocalStorage cache set error:", error);
    }
  },

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const isExpired = Date.now() - parsed.timestamp > parsed.ttl;

      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data as T;
    } catch (error) {
      console.error("LocalStorage cache get error:", error);
      return null;
    }
  },

  delete(key: string) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("LocalStorage cache delete error:", error);
    }
  },

  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("LocalStorage cache clear error:", error);
    }
  },
};

/**
 * IndexedDB cache - for large data, persists across sessions
 */
const DB_NAME = "findam-cache";
const DB_VERSION = 1;
const STORE_NAME = "cache";

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
}

export const IndexedDBCache = {
  async set(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000) {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const item = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      store.put(item, key);

      return new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error("IndexedDB cache set error:", error);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const item = request.result;
          if (!item) {
            resolve(null);
            return;
          }

          const isExpired = Date.now() - item.timestamp > item.ttl;
          if (isExpired) {
            this.delete(key);
            resolve(null);
            return;
          }

          resolve(item.data as T);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("IndexedDB cache get error:", error);
      return null;
    }
  },

  async delete(key: string) {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.delete(key);

      return new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error("IndexedDB cache delete error:", error);
    }
  },

  async clear() {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      store.clear();

      return new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error("IndexedDB cache clear error:", error);
    }
  },
};

/**
 * Unified cache interface with automatic tier selection
 */
export const Cache = {
  /**
   * Set data in appropriate cache tier based on size
   */
  async set(key: string, data: any, ttl?: number) {
    const dataSize = JSON.stringify(data).length;

    // Small data (< 100KB) - use memory cache
    if (dataSize < 100 * 1024) {
      MemoryCache.set(key, data, ttl);
      return;
    }

    // Medium data (< 5MB) - use LocalStorage
    if (dataSize < 5 * 1024 * 1024) {
      LocalStorageCache.set(key, data, ttl);
      return;
    }

    // Large data - use IndexedDB
    await IndexedDBCache.set(key, data, ttl);
  },

  /**
   * Get data from cache, checking all tiers
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first (fastest)
    const memoryData = MemoryCache.get<T>(key);
    if (memoryData) return memoryData;

    // Check LocalStorage
    const localData = LocalStorageCache.get<T>(key);
    if (localData) {
      // Promote to memory cache
      MemoryCache.set(key, localData);
      return localData;
    }

    // Check IndexedDB
    const indexedData = await IndexedDBCache.get<T>(key);
    if (indexedData) {
      // Promote to memory cache
      MemoryCache.set(key, indexedData);
      return indexedData;
    }

    return null;
  },

  /**
   * Delete from all cache tiers
   */
  async delete(key: string) {
    MemoryCache.delete(key);
    LocalStorageCache.delete(key);
    await IndexedDBCache.delete(key);
  },

  /**
   * Clear all caches
   */
  async clear() {
    MemoryCache.clear();
    LocalStorageCache.clear();
    await IndexedDBCache.clear();
  },
};

/**
 * SWR-style cache hook for data fetching
 */
export function createCachedFetcher<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
  } = {},
) {
  const {
    ttl = 5 * 60 * 1000,
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
  } = options;

  return async (): Promise<T> => {
    // Try to get from cache first
    const cached = await Cache.get<T>(key);
    if (cached) return cached;

    // Fetch fresh data
    const data = await fetcher();
    await Cache.set(key, data, ttl);

    return data;
  };
}
