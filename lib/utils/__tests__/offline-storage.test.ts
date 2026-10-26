import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  openDB,
  saveToStore,
  getFromStore,
  getAllFromStore,
  deleteFromStore,
  clearStore,
  queryByIndex,
  savePreference,
  getPreference,
  cacheListings,
  getCachedListings,
  cacheConversations,
  getCachedConversations,
  cacheMessages,
  getCachedMessages,
  STORES,
} from "../offline-storage";

describe("Offline Storage", () => {
  beforeEach(async () => {
    // Clear all stores before each test
    const db = await openDB();
    const storeNames = Object.values(STORES) as any[];
    for (const storeName of storeNames) {
      if (db.objectStoreNames.contains(storeName)) {
        await clearStore(storeName as any);
      }
    }
  });

  afterEach(async () => {
    // Clean up after tests
    const db = await openDB();
    db.close();
  });

  describe("Database Operations", () => {
    it("should open IndexedDB successfully", async () => {
      const db = await openDB();
      expect(db).toBeDefined();
      expect(db.name).toBe("findam-offline");
      expect(db.version).toBe(2);
    });

    it("should create all required object stores", async () => {
      const db = await openDB();
      // Check the actual store names used in the schema
      const requiredStores = [
        "preferences",
        "offline-queue",
        "cached-listings",
        "saved-listings",
        "session-state",
      ];

      for (const storeName of requiredStores) {
        expect(db.objectStoreNames.contains(storeName as any)).toBe(true);
      }
    });
  });

  describe("CRUD Operations", () => {
    it("should save and retrieve data from store", async () => {
      const testData = { id: "test-1", name: "Test Item" };
      await saveToStore(STORES.LISTINGS as any, testData);

      const retrieved = await getFromStore(STORES.LISTINGS as any, "test-1");
      expect(retrieved).toEqual(testData);
    });

    it("should save multiple items to store", async () => {
      const testData = [
        { id: "test-1", name: "Item 1" },
        { id: "test-2", name: "Item 2" },
        { id: "test-3", name: "Item 3" },
      ];

      await saveToStore(STORES.LISTINGS, testData);

      const allItems = await getAllFromStore(STORES.LISTINGS);
      expect(allItems).toHaveLength(3);
      expect(allItems).toEqual(expect.arrayContaining(testData));
    });

    it("should update existing data", async () => {
      const original = { id: "test-1", name: "Original" };
      await saveToStore(STORES.LISTINGS, original);

      const updated = { id: "test-1", name: "Updated" };
      await saveToStore(STORES.LISTINGS, updated);

      const retrieved = await getFromStore(STORES.LISTINGS, "test-1");
      expect(retrieved).toEqual(updated);
    });

    it("should delete data from store", async () => {
      const testData = { id: "test-1", name: "Test Item" };
      await saveToStore(STORES.LISTINGS, testData);

      await deleteFromStore(STORES.LISTINGS, "test-1");

      const retrieved = await getFromStore(STORES.LISTINGS, "test-1");
      expect(retrieved).toBeUndefined();
    });

    it("should clear all data from store", async () => {
      const testData = [
        { id: "test-1", name: "Item 1" },
        { id: "test-2", name: "Item 2" },
      ];
      await saveToStore(STORES.LISTINGS, testData);

      await clearStore(STORES.LISTINGS);

      const allItems = await getAllFromStore(STORES.LISTINGS);
      expect(allItems).toHaveLength(0);
    });
  });

  describe("Index Queries", () => {
    it("should query data by index", async () => {
      const testData = [
        { id: "1", user_id: "user-1", title: "Listing 1" },
        { id: "2", user_id: "user-1", title: "Listing 2" },
        { id: "3", user_id: "user-2", title: "Listing 3" },
      ];

      await saveToStore(STORES.LISTINGS, testData);

      const user1Listings = await queryByIndex(
        STORES.LISTINGS,
        "user_id",
        "user-1",
      );

      expect(user1Listings).toHaveLength(2);
      expect(
        user1Listings.every((item: any) => item.user_id === "user-1"),
      ).toBe(true);
    });
  });

  describe("Preference Management", () => {
    it("should save and retrieve preferences", async () => {
      await savePreference("theme", "dark");
      const theme = await getPreference("theme");
      expect(theme).toBe("dark");
    });

    it("should update existing preference", async () => {
      await savePreference("theme", "dark");
      await savePreference("theme", "light");

      const theme = await getPreference("theme");
      expect(theme).toBe("light");
    });

    it("should return undefined for non-existent preference", async () => {
      const result = await getPreference("non-existent");
      expect(result).toBeUndefined();
    });

    it("should handle complex preference objects", async () => {
      const preferences = {
        notifications: true,
        autoPlay: false,
        language: "en",
      };

      await savePreference("user_settings", preferences);
      const retrieved = await getPreference("user_settings");
      expect(retrieved).toEqual(preferences);
    });
  });

  describe("Listing Cache", () => {
    it("should cache and retrieve listings", async () => {
      const listings = [
        { id: "1", title: "Listing 1", price: 1000 },
        { id: "2", title: "Listing 2", price: 2000 },
      ];

      await cacheListings(listings);
      const cached = await getCachedListings();

      expect(cached).toHaveLength(2);
      expect(cached).toEqual(expect.arrayContaining(listings));
    });

    it("should update cached listings", async () => {
      const initial = [{ id: "1", title: "Original", price: 1000 }];
      await cacheListings(initial);

      const updated = [{ id: "1", title: "Updated", price: 1500 }];
      await cacheListings(updated);

      const cached = await getCachedListings();
      expect(cached[0].title).toBe("Updated");
      expect(cached[0].price).toBe(1500);
    });
  });

  describe("Conversation Cache", () => {
    it("should cache and retrieve conversations", async () => {
      const conversations = [
        { id: "conv-1", listing_id: "listing-1" },
        { id: "conv-2", listing_id: "listing-2" },
      ];

      await cacheConversations(conversations);
      const cached = await getCachedConversations();

      expect(cached).toHaveLength(2);
      expect(cached).toEqual(expect.arrayContaining(conversations));
    });
  });

  describe("Message Cache", () => {
    it("should cache and retrieve messages", async () => {
      const messages = [
        { id: "msg-1", conversation_id: "conv-1", content: "Hello" },
        { id: "msg-2", conversation_id: "conv-1", content: "Hi there" },
        { id: "msg-3", conversation_id: "conv-2", content: "Different conv" },
      ];

      await cacheMessages(messages);

      const conv1Messages = await getCachedMessages("conv-1");
      expect(conv1Messages).toHaveLength(2);
      expect(
        conv1Messages.every((msg: any) => msg.conversation_id === "conv-1"),
      ).toBe(true);
    });

    it("should return empty array for conversation with no messages", async () => {
      const messages = await getCachedMessages("non-existent");
      expect(messages).toHaveLength(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid store names gracefully", async () => {
      await expect(
        saveToStore("invalid-store" as any, { id: "test" }),
      ).rejects.toThrow();
    });

    it("should handle malformed data gracefully", async () => {
      // Try to save data without required id field
      await expect(
        saveToStore(STORES.LISTINGS as any, { name: "No ID" } as any),
      ).rejects.toThrow();
    });
  });

  describe("Data Persistence", () => {
    it("should persist data across database reopens", async () => {
      const testData = { id: "persist-test", value: "persistent" };
      await saveToStore(STORES.LISTINGS, testData);

      // Close and reopen database
      let db = await openDB();
      db.close();

      db = await openDB();
      const retrieved = await getFromStore(STORES.LISTINGS, "persist-test");
      expect(retrieved).toEqual(testData);
    });
  });
});
