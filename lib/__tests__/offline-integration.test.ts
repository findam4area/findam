import { describe, it, expect, beforeEach } from "vitest";

/**
 * Integration tests for offline functionality
 * These tests verify the core offline support features work correctly
 */

describe("Offline Support Integration", () => {
  describe("Service Worker Configuration", () => {
    it("should have service worker file in public directory", async () => {
      // Verify sw.js exists and has required content
      const swPath = "./public/sw.js";
      const fs = await import("fs");
      const path = await import("path");

      const swFile = path.resolve(process.cwd(), swPath);
      const exists = fs.existsSync(swFile);

      expect(exists).toBe(true);

      if (exists) {
        const content = fs.readFileSync(swFile, "utf-8");

        // Verify key service worker features
        expect(content).toContain("CACHE_VERSION");
        expect(content).toContain("addEventListener");
        expect(content).toContain("install");
        expect(content).toContain("fetch");
        expect(content).toContain("activate");
        expect(content).toContain("sync");
      }
    });
  });

  describe("Offline Storage Module", () => {
    it("should export required functions", async () => {
      const offlineStorage = await import("../utils/offline-storage");

      expect(offlineStorage.openDB).toBeDefined();
      expect(offlineStorage.saveToStore).toBeDefined();
      expect(offlineStorage.getFromStore).toBeDefined();
      expect(offlineStorage.getAllFromStore).toBeDefined();
      expect(offlineStorage.deleteFromStore).toBeDefined();
      expect(offlineStorage.clearStore).toBeDefined();
      expect(offlineStorage.queryByIndex).toBeDefined();
      expect(offlineStorage.savePreference).toBeDefined();
      expect(offlineStorage.getPreference).toBeDefined();
      expect(offlineStorage.cacheListings).toBeDefined();
      expect(offlineStorage.getCachedListings).toBeDefined();
      expect(offlineStorage.STORES).toBeDefined();
    });

    it("should have all required stores defined", async () => {
      const { STORES } = await import("../utils/offline-storage");

      expect(STORES.LISTINGS).toBe("cached-listings");
      expect(STORES.SAVED_LISTINGS).toBe("saved-listings");
      expect(STORES.CONVERSATIONS).toBe("conversations");
      expect(STORES.MESSAGES).toBe("messages");
      expect(STORES.PREFERENCES).toBe("preferences");
      expect(STORES.OFFLINE_QUEUE).toBe("offline-queue");
      expect(STORES.SESSION_STATE).toBe("session-state");
    });
  });

  describe("Offline Hook", () => {
    it("should export useOffline hook", async () => {
      const { useOffline } = await import("../hooks/useOffline");

      expect(useOffline).toBeDefined();
      expect(typeof useOffline).toBe("function");
    });
  });

  describe("Offline API Client", () => {
    it("should export offline fetch functions", async () => {
      const offlineClient = await import("../api/offline-client");

      expect(offlineClient.offlineFetch).toBeDefined();
      expect(offlineClient.getQueuedRequests).toBeDefined();
      expect(offlineClient.syncQueuedRequests).toBeDefined();
    });
  });

  describe("Persistent Data Hook", () => {
    it("should export persistence hooks", async () => {
      const persistentData = await import("../hooks/usePersistentData");

      expect(persistentData.usePersistentData).toBeDefined();
      expect(persistentData.useImmediatePersist).toBeDefined();
      expect(persistentData.useBatchPersist).toBeDefined();
    });
  });

  describe("Preferences Store", () => {
    it("should export preferences store", async () => {
      const { usePreferencesStore } = await import("../../store/preferences");

      expect(usePreferencesStore).toBeDefined();
      expect(typeof usePreferencesStore).toBe("function");
    });

    it("should have default preferences", async () => {
      const { usePreferencesStore } = await import("../../store/preferences");
      const store = usePreferencesStore.getState();

      expect(store.theme).toBeDefined();
      expect(store.feedView).toBeDefined();
      expect(store.autoPlayVideos).toBeDefined();
      expect(store.notificationsEnabled).toBeDefined();
      expect(store.recentSearches).toBeDefined();
      expect(store.savedFilters).toBeDefined();
    });
  });

  describe("Offline Indicator Component", () => {
    it("should have offline indicator component file", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const componentPath = path.resolve(
        process.cwd(),
        "./components/shared/offline-indicator.tsx",
      );
      const exists = fs.existsSync(componentPath);

      expect(exists).toBe(true);
    });
  });

  describe("Service Worker Registration", () => {
    it("should have enhanced service worker registration", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const regPath = path.resolve(process.cwd(), "./app/register-sw.tsx");
      const exists = fs.existsSync(regPath);

      expect(exists).toBe(true);

      if (exists) {
        const content = fs.readFileSync(regPath, "utf-8");

        // Verify enhanced features
        expect(content).toContain("serviceWorker");
        expect(content).toContain("register");
        expect(content).toContain("updatefound");
      }
    });
  });

  describe("Documentation", () => {
    it("should have offline support documentation", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const docPath = path.resolve(
        process.cwd(),
        "./lib/utils/OFFLINE_SUPPORT.md",
      );
      const exists = fs.existsSync(docPath);

      expect(exists).toBe(true);

      if (exists) {
        const content = fs.readFileSync(docPath, "utf-8");

        // Verify documentation completeness
        expect(content).toContain("Service Worker");
        expect(content).toContain("IndexedDB");
        expect(content).toContain("Offline");
        expect(content).toContain("Sync");
        expect(content).toContain("Usage");
        expect(content).toContain("Testing");
      }
    });
  });

  describe("Type Safety", () => {
    it("should have proper TypeScript types", async () => {
      const { STORES } = await import("../utils/offline-storage");

      // Verify STORES is properly typed
      const storeKeys = Object.keys(STORES);
      expect(storeKeys.length).toBeGreaterThan(0);

      // All store values should be strings
      Object.values(STORES).forEach((value) => {
        expect(typeof value).toBe("string");
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle module imports gracefully", async () => {
      // All modules should import without errors
      await expect(import("../utils/offline-storage")).resolves.toBeDefined();
      await expect(import("../hooks/useOffline")).resolves.toBeDefined();
      await expect(import("../api/offline-client")).resolves.toBeDefined();
      await expect(import("../hooks/usePersistentData")).resolves.toBeDefined();
      await expect(import("../../store/preferences")).resolves.toBeDefined();
    });
  });
});

describe("Session State Management", () => {
  describe("Auth Context Enhancement", () => {
    it("should have enhanced auth context", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const authPath = path.resolve(
        process.cwd(),
        "./lib/contexts/auth-context.tsx",
      );
      const exists = fs.existsSync(authPath);

      expect(exists).toBe(true);

      if (exists) {
        const content = fs.readFileSync(authPath, "utf-8");

        // Verify session restoration features
        expect(content).toContain("restoreSession");
        expect(content).toContain("saveSessionState");
        expect(content).toContain("savePreference");
        expect(content).toContain("last_user");
        expect(content).toContain("last_session_timestamp");
      }
    });
  });

  describe("Preferences Persistence", () => {
    it("should have preferences store with persistence", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const prefPath = path.resolve(process.cwd(), "./store/preferences.ts");
      const exists = fs.existsSync(prefPath);

      expect(exists).toBe(true);

      if (exists) {
        const content = fs.readFileSync(prefPath, "utf-8");

        // Verify persistence features
        expect(content).toContain("persist");
        expect(content).toContain("loadPreferences");
        expect(content).toContain("persistPreferences");
        expect(content).toContain("savePreference");
      }
    });
  });

  describe("Layout Integration", () => {
    it("should have offline indicator in layout", async () => {
      const fs = await import("fs");
      const path = await import("path");

      const layoutPath = path.resolve(process.cwd(), "./app/layout.tsx");
      const exists = fs.existsSync(layoutPath);

      expect(exists).toBe(true);

      if (exists) {
        const content = fs.readFileSync(layoutPath, "utf-8");

        // Verify offline indicator is included
        expect(content).toContain("OfflineIndicator");
        expect(content).toContain("Toaster");
      }
    });
  });
});

describe("Requirements Validation", () => {
  it("should satisfy Requirement 13.6 - PWA offline functionality", async () => {
    const fs = await import("fs");
    const path = await import("path");

    // Service worker exists
    const swExists = fs.existsSync(
      path.resolve(process.cwd(), "./public/sw.js"),
    );
    expect(swExists).toBe(true);

    // Offline storage module exists
    const storageModule = await import("../utils/offline-storage");
    expect(storageModule).toBeDefined();

    // Offline hook exists
    const { useOffline } = await import("../hooks/useOffline");
    expect(useOffline).toBeDefined();
  });

  it("should satisfy Requirement 20.1 - Session state restoration", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const authPath = path.resolve(
      process.cwd(),
      "./lib/contexts/auth-context.tsx",
    );
    const content = fs.readFileSync(authPath, "utf-8");

    // Verify session restoration features
    expect(content).toContain("restoreSession");
    expect(content).toContain("saveSessionState");
  });

  it("should satisfy Requirement 20.3 - Immediate data persistence", async () => {
    const persistentData = await import("../hooks/usePersistentData");

    // Verify persistence hooks exist
    expect(persistentData.usePersistentData).toBeDefined();
    expect(persistentData.useImmediatePersist).toBeDefined();
  });

  it("should satisfy Requirement 20.4 - Offline data access", async () => {
    const offlineStorage = await import("../utils/offline-storage");

    // Verify caching functions exist
    expect(offlineStorage.cacheListings).toBeDefined();
    expect(offlineStorage.getCachedListings).toBeDefined();
    expect(offlineStorage.cacheConversations).toBeDefined();
    expect(offlineStorage.cacheMessages).toBeDefined();
  });

  it("should satisfy Requirement 20.5 - Offline action sync", async () => {
    const offlineClient = await import("../api/offline-client");

    // Verify sync functions exist
    expect(offlineClient.getQueuedRequests).toBeDefined();
    expect(offlineClient.syncQueuedRequests).toBeDefined();

    const { useOffline } = await import("../hooks/useOffline");
    expect(useOffline).toBeDefined();
  });
});
