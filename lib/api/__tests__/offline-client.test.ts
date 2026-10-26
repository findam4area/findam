import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  offlineFetch,
  getQueuedRequests,
  syncQueuedRequests,
} from "../offline-client";
import * as offlineStorage from "@/lib/utils/offline-storage";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Offline API Client", () => {
  let originalNavigator: any;
  let originalFetch: any;

  beforeEach(() => {
    // Save originals
    originalNavigator = global.navigator;
    originalFetch = global.fetch;

    // Mock navigator.onLine
    Object.defineProperty(global.navigator, "onLine", {
      writable: true,
      value: true,
    });

    // Mock fetch
    global.fetch = vi.fn();

    // Mock IndexedDB operations
    vi.spyOn(offlineStorage, "openDB").mockResolvedValue({
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          getAll: vi.fn().mockReturnValue({
            onsuccess: null,
            result: [],
          }),
          add: vi.fn(),
          delete: vi.fn(),
        }),
      }),
    } as any);

    vi.spyOn(offlineStorage, "getCachedListings").mockResolvedValue([]);
    vi.spyOn(offlineStorage, "getCachedConversations").mockResolvedValue([]);
    vi.spyOn(offlineStorage, "getCachedMessages").mockResolvedValue([]);
    vi.spyOn(offlineStorage, "cacheListings").mockResolvedValue();
    vi.spyOn(offlineStorage, "cacheConversations").mockResolvedValue();
    vi.spyOn(offlineStorage, "cacheMessages").mockResolvedValue();
    vi.spyOn(offlineStorage, "saveToStore").mockResolvedValue();
    vi.spyOn(offlineStorage, "getAllFromStore").mockResolvedValue([]);
  });

  afterEach(() => {
    // Restore originals
    global.navigator = originalNavigator;
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("Online Requests", () => {
    it("should make successful GET request when online", async () => {
      const mockData = [{ id: "1", title: "Test Listing" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await offlineFetch("/api/listings");

      expect(global.fetch).toHaveBeenCalledWith("/api/listings", {});
      expect(result).toEqual(mockData);
    });

    it("should cache GET responses", async () => {
      const mockData = [{ id: "1", title: "Test Listing" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await offlineFetch("/api/listings");

      expect(offlineStorage.cacheListings).toHaveBeenCalledWith(mockData);
    });

    it("should make successful POST request when online", async () => {
      const mockResponse = { id: "1", title: "New Listing" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await offlineFetch("/api/listings", {
        method: "POST",
        body: JSON.stringify({ title: "New Listing" }),
      });

      expect(result).toEqual(mockResponse);
    });

    it("should not cache POST responses", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await offlineFetch("/api/listings", { method: "POST" });

      expect(offlineStorage.cacheListings).not.toHaveBeenCalled();
    });

    it("should skip cache when skipCache option is true", async () => {
      const mockData = [{ id: "1", title: "Test" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await offlineFetch("/api/listings", { skipCache: true });

      expect(offlineStorage.cacheListings).not.toHaveBeenCalled();
    });
  });

  describe("Offline Requests", () => {
    beforeEach(() => {
      Object.defineProperty(global.navigator, "onLine", {
        writable: true,
        value: false,
      });
    });

    it("should return cached data for GET requests when offline", async () => {
      const cachedData = [{ id: "1", title: "Cached Listing" }];
      vi.spyOn(offlineStorage, "getCachedListings").mockResolvedValueOnce(
        cachedData,
      );

      const result = await offlineFetch("/api/listings");

      expect(result).toEqual(cachedData);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should throw error when no cached data available offline", async () => {
      // Mock getCachedListings to return empty array (no cache)
      vi.spyOn(offlineStorage, "getCachedListings").mockResolvedValueOnce([]);

      await expect(offlineFetch("/api/listings")).rejects.toThrow(
        "No cached data available offline",
      );
    });

    it("should queue POST requests when offline", async () => {
      await expect(
        offlineFetch("/api/listings", {
          method: "POST",
          body: JSON.stringify({ title: "New" }),
          queueIfOffline: true,
        }),
      ).rejects.toThrow("Request queued for sync when online");

      expect(offlineStorage.saveToStore).toHaveBeenCalled();
    });

    it("should not queue when queueIfOffline is false", async () => {
      await expect(
        offlineFetch("/api/listings", {
          method: "POST",
          queueIfOffline: false,
        }),
      ).rejects.toThrow("Cannot perform this action offline");

      expect(offlineStorage.saveToStore).not.toHaveBeenCalled();
    });
  });

  describe("Cache Management", () => {
    it("should cache listings from API response", async () => {
      const mockData = [
        { id: "1", title: "Listing 1" },
        { id: "2", title: "Listing 2" },
      ];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await offlineFetch("/api/listings");

      expect(offlineStorage.cacheListings).toHaveBeenCalledWith(mockData);
    });

    it("should cache listings from nested response", async () => {
      const mockData = {
        listings: [{ id: "1", title: "Listing 1" }],
        total: 1,
      };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await offlineFetch("/api/listings");

      expect(offlineStorage.cacheListings).toHaveBeenCalledWith(
        mockData.listings,
      );
    });

    it("should cache conversations", async () => {
      const mockData = [{ id: "conv-1", listing_id: "listing-1" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await offlineFetch("/api/conversations");

      expect(offlineStorage.cacheConversations).toHaveBeenCalledWith(mockData);
    });

    it("should cache messages", async () => {
      const mockData = [
        { id: "msg-1", conversation_id: "conv-1", content: "Hello" },
      ];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await offlineFetch("/api/conversations/conv-1/messages");

      expect(offlineStorage.cacheMessages).toHaveBeenCalledWith(mockData);
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      // Clear all mocks before each error handling test
      vi.clearAllMocks();

      // Re-setup basic mocks
      vi.spyOn(offlineStorage, "getCachedListings").mockResolvedValue([]);
      vi.spyOn(offlineStorage, "getCachedConversations").mockResolvedValue([]);
      vi.spyOn(offlineStorage, "getCachedMessages").mockResolvedValue([]);
      vi.spyOn(offlineStorage, "cacheListings").mockResolvedValue();
      vi.spyOn(offlineStorage, "cacheConversations").mockResolvedValue();
      vi.spyOn(offlineStorage, "cacheMessages").mockResolvedValue();
    });

    it("should handle HTTP errors", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(offlineFetch("/api/listings")).rejects.toThrow(
        "HTTP error! status: 404",
      );
    });

    it("should fallback to cache on network error", async () => {
      const cachedData = [{ id: "1", title: "Cached" }];
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      // Set up the mock to return cached data
      vi.mocked(offlineStorage.getCachedListings).mockResolvedValueOnce(
        cachedData,
      );

      const result = await offlineFetch("/api/listings");

      expect(result).toEqual(cachedData);
    });

    it("should throw error when no cache available after network error", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));
      // Mock returns empty array (no cache)
      vi.mocked(offlineStorage.getCachedListings).mockResolvedValueOnce([]);

      await expect(offlineFetch("/api/listings")).rejects.toThrow();
    });

    it("should handle cache errors gracefully", async () => {
      const mockData = [{ id: "1", title: "Test" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });
      vi.spyOn(offlineStorage, "cacheListings").mockRejectedValueOnce(
        new Error("Cache error"),
      );

      // Should still return data even if caching fails
      const result = await offlineFetch("/api/listings");
      expect(result).toEqual(mockData);
    });
  });

  describe("Queue Management", () => {
    it("should get all queued requests", async () => {
      const mockQueue = [
        { url: "/api/listings", method: "POST" },
        { url: "/api/messages", method: "POST" },
      ];
      vi.spyOn(offlineStorage, "getAllFromStore").mockResolvedValueOnce(
        mockQueue,
      );

      const result = await getQueuedRequests();

      expect(result).toEqual(mockQueue);
      expect(offlineStorage.getAllFromStore).toHaveBeenCalledWith(
        offlineStorage.STORES.OFFLINE_QUEUE,
      );
    });

    it("should sync queued requests when online", async () => {
      const mockQueue = [
        {
          id: 1,
          url: "/api/listings",
          method: "POST",
          headers: {},
          body: "{}",
        },
      ];
      vi.spyOn(offlineStorage, "getAllFromStore").mockResolvedValueOnce(
        mockQueue,
      );
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      await syncQueuedRequests();

      expect(global.fetch).toHaveBeenCalledWith("/api/listings", {
        method: "POST",
        headers: {},
        body: "{}",
      });
    });

    it("should not sync when offline", async () => {
      Object.defineProperty(global.navigator, "onLine", {
        writable: true,
        value: false,
      });

      await syncQueuedRequests();

      expect(offlineStorage.getAllFromStore).not.toHaveBeenCalled();
    });

    it("should handle sync errors gracefully", async () => {
      const mockQueue = [
        {
          id: 1,
          url: "/api/listings",
          method: "POST",
          headers: {},
          body: "{}",
        },
      ];
      vi.spyOn(offlineStorage, "getAllFromStore").mockResolvedValueOnce(
        mockQueue,
      );
      (global.fetch as any).mockRejectedValueOnce(new Error("Sync error"));

      // Should not throw
      await expect(syncQueuedRequests()).resolves.not.toThrow();
    });
  });

  describe("URL Pattern Matching", () => {
    it("should cache listings endpoint variations", async () => {
      const urls = [
        "/api/listings",
        "/api/listings?page=1",
        "/api/listings?category=electronics",
      ];

      for (const url of urls) {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: "1" }],
        });

        await offlineFetch(url);
        expect(offlineStorage.cacheListings).toHaveBeenCalled();
        vi.clearAllMocks();
      }
    });

    it("should extract conversation ID from messages URL", async () => {
      const mockData = [{ id: "msg-1", conversation_id: "conv-123" }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await offlineFetch("/api/conversations/conv-123/messages");

      expect(offlineStorage.cacheMessages).toHaveBeenCalledWith(mockData);
    });
  });

  describe("Request Options", () => {
    it("should pass through custom headers", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await offlineFetch("/api/listings", {
        headers: { Authorization: "Bearer token" },
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/listings", {
        headers: { Authorization: "Bearer token" },
      });
    });

    it("should handle different HTTP methods", async () => {
      const methods = ["GET", "POST", "PUT", "DELETE"];

      for (const method of methods) {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await offlineFetch("/api/listings", { method });
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/listings",
          expect.objectContaining({ method }),
        );
        vi.clearAllMocks();
      }
    });
  });
});
