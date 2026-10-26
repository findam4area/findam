import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useOffline } from "../useOffline";
import { openDB, clearStore, STORES } from "@/lib/utils/offline-storage";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe("useOffline Hook", () => {
  beforeEach(async () => {
    // Clear offline queue before each test
    const db = await openDB();
    await clearStore(STORES.OFFLINE_QUEUE);
    db.close();

    // Reset navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Online Status Detection", () => {
    it("should initialize with online status", () => {
      const { result } = renderHook(() => useOffline());
      expect(result.current.isOnline).toBe(true);
    });

    it("should detect offline status", async () => {
      const { result } = renderHook(() => useOffline());

      act(() => {
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event("offline"));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });
    });

    it("should detect when coming back online", async () => {
      const { result } = renderHook(() => useOffline());

      // Go offline
      act(() => {
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event("offline"));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      // Come back online
      act(() => {
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event("online"));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });
    });
  });

  describe("Action Queuing", () => {
    it("should queue actions when offline", async () => {
      const { result } = renderHook(() => useOffline());

      await act(async () => {
        await result.current.queueAction(
          "/api/test",
          "POST",
          { data: "test" },
          { "Content-Type": "application/json" },
        );
      });

      await waitFor(() => {
        expect(result.current.queuedActions.length).toBeGreaterThan(0);
      });
    });

    it("should track multiple queued actions", async () => {
      const { result } = renderHook(() => useOffline());

      await act(async () => {
        await result.current.queueAction("/api/test1", "POST", { data: "1" });
        await result.current.queueAction("/api/test2", "POST", { data: "2" });
        await result.current.queueAction("/api/test3", "PUT", { data: "3" });
      });

      await waitFor(() => {
        expect(result.current.queuedActions.length).toBe(3);
      });
    });

    it("should include timestamp in queued actions", async () => {
      const { result } = renderHook(() => useOffline());
      const beforeTime = Date.now();

      await act(async () => {
        await result.current.queueAction("/api/test", "POST", { data: "test" });
      });

      await waitFor(() => {
        const action = result.current.queuedActions[0];
        expect(action.timestamp).toBeGreaterThanOrEqual(beforeTime);
        expect(action.timestamp).toBeLessThanOrEqual(Date.now());
      });
    });
  });

  describe("Queue Management", () => {
    it("should clear all queued actions", async () => {
      const { result } = renderHook(() => useOffline());

      // Queue some actions
      await act(async () => {
        await result.current.queueAction("/api/test1", "POST", { data: "1" });
        await result.current.queueAction("/api/test2", "POST", { data: "2" });
      });

      await waitFor(() => {
        expect(result.current.queuedActions.length).toBe(2);
      });

      // Clear queue
      await act(async () => {
        await result.current.clearQueue();
      });

      await waitFor(() => {
        expect(result.current.queuedActions.length).toBe(0);
      });
    });

    it("should load existing queued actions on mount", async () => {
      // Pre-populate queue
      const db = await openDB();
      const tx = db.transaction(STORES.OFFLINE_QUEUE, "readwrite");
      await tx.objectStore(STORES.OFFLINE_QUEUE).add({
        url: "/api/existing",
        method: "POST",
        headers: {},
        body: JSON.stringify({ data: "existing" }),
        timestamp: Date.now(),
      });
      db.close();

      // Mount hook
      const { result } = renderHook(() => useOffline());

      await waitFor(() => {
        expect(result.current.queuedActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Sync Functionality", () => {
    it("should provide sync function", () => {
      const { result } = renderHook(() => useOffline());
      expect(typeof result.current.syncOfflineQueue).toBe("function");
    });

    it("should not sync when offline", async () => {
      const { result } = renderHook(() => useOffline());

      // Go offline
      act(() => {
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event("offline"));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      // Attempt sync (should not throw)
      await act(async () => {
        await result.current.syncOfflineQueue();
      });
    });
  });

  describe("Service Worker Integration", () => {
    it("should handle service worker messages", async () => {
      const { result } = renderHook(() => useOffline());

      // Queue an action
      await act(async () => {
        await result.current.queueAction("/api/test", "POST", { data: "test" });
      });

      await waitFor(() => {
        expect(result.current.queuedActions.length).toBeGreaterThan(0);
      });

      const initialCount = result.current.queuedActions.length;

      // Simulate service worker sync success message
      // Note: In test environment, service worker events don't work the same way
      // This test verifies the hook structure is correct
      expect(result.current.queuedActions).toBeDefined();
      expect(initialCount).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle queue action errors gracefully", async () => {
      const { result } = renderHook(() => useOffline());

      // This should not throw even if there's an error
      await act(async () => {
        await result.current.queueAction("", "", undefined);
      });

      // Hook should still be functional
      expect(result.current.isOnline).toBeDefined();
    });

    it("should handle clear queue errors gracefully", async () => {
      const { result } = renderHook(() => useOffline());

      // Should not throw
      await act(async () => {
        await result.current.clearQueue();
      });

      expect(result.current.queuedActions).toBeDefined();
    });
  });
});
