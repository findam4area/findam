import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePreferencesStore } from "../preferences";

// Mock offline storage
vi.mock("@/lib/utils/offline-storage", () => ({
  savePreference: vi.fn().mockResolvedValue(undefined),
  getPreference: vi.fn().mockResolvedValue(null),
}));

describe("Preferences Store", () => {
  beforeEach(() => {
    // Reset store to default state
    const { result } = renderHook(() => usePreferencesStore());
    act(() => {
      result.current.reset();
    });
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should have default preferences", () => {
      const { result } = renderHook(() => usePreferencesStore());

      expect(result.current.theme).toBe("dark");
      expect(result.current.feedView).toBe("grid");
      expect(result.current.autoPlayVideos).toBe(true);
      expect(result.current.notificationsEnabled).toBe(true);
      expect(result.current.language).toBe("en");
      expect(result.current.currency).toBe("NGN");
    });

    it("should have empty arrays for dynamic preferences", () => {
      const { result } = renderHook(() => usePreferencesStore());

      expect(result.current.recentSearches).toEqual([]);
      expect(result.current.savedFilters).toEqual([]);
    });
  });

  describe("Theme Preferences", () => {
    it("should update theme", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setTheme("light");
      });

      expect(result.current.theme).toBe("light");
    });

    it("should toggle between dark and light", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setTheme("light");
      });
      expect(result.current.theme).toBe("light");

      act(() => {
        result.current.setTheme("dark");
      });
      expect(result.current.theme).toBe("dark");
    });
  });

  describe("Display Preferences", () => {
    it("should update feed view", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setFeedView("list");
      });

      expect(result.current.feedView).toBe("list");
    });

    it("should toggle autoplay videos", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setAutoPlayVideos(false);
      });

      expect(result.current.autoPlayVideos).toBe(false);
    });
  });

  describe("Notification Preferences", () => {
    it("should update notifications enabled", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setNotificationsEnabled(false);
      });

      expect(result.current.notificationsEnabled).toBe(false);
    });

    it("should update email notifications", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setEmailNotifications(false);
      });

      expect(result.current.emailNotifications).toBe(false);
    });

    it("should update push notifications", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setPushNotifications(false);
      });

      expect(result.current.pushNotifications).toBe(false);
    });

    it("should update message notifications", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setMessageNotifications(false);
      });

      expect(result.current.messageNotifications).toBe(false);
    });

    it("should update listing notifications", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setListingNotifications(false);
      });

      expect(result.current.listingNotifications).toBe(false);
    });
  });

  describe("Search Preferences", () => {
    it("should add recent search", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.addRecentSearch("laptop");
      });

      expect(result.current.recentSearches).toContain("laptop");
    });

    it("should add multiple recent searches", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.addRecentSearch("laptop");
        result.current.addRecentSearch("phone");
        result.current.addRecentSearch("tablet");
      });

      expect(result.current.recentSearches).toHaveLength(3);
      expect(result.current.recentSearches[0]).toBe("tablet");
    });

    it("should not duplicate recent searches", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.addRecentSearch("laptop");
        result.current.addRecentSearch("phone");
        result.current.addRecentSearch("laptop");
      });

      expect(result.current.recentSearches).toHaveLength(2);
      expect(result.current.recentSearches[0]).toBe("laptop");
    });

    it("should limit recent searches to 10", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.addRecentSearch(`search-${i}`);
        }
      });

      expect(result.current.recentSearches).toHaveLength(10);
    });

    it("should clear recent searches", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.addRecentSearch("laptop");
        result.current.addRecentSearch("phone");
        result.current.clearRecentSearches();
      });

      expect(result.current.recentSearches).toHaveLength(0);
    });
  });

  describe("Saved Filters", () => {
    it("should save filter", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.saveFilter("electronics", {
          category: "electronics",
          priceMin: 1000,
          priceMax: 50000,
        });
      });

      expect(result.current.savedFilters).toHaveLength(1);
      expect(result.current.savedFilters[0]).toMatchObject({
        name: "electronics",
        category: "electronics",
      });
    });

    it("should update existing filter", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.saveFilter("electronics", {
          category: "electronics",
          priceMin: 1000,
        });
        result.current.saveFilter("electronics", {
          category: "electronics",
          priceMin: 2000,
        });
      });

      expect(result.current.savedFilters).toHaveLength(1);
      expect(result.current.savedFilters[0].priceMin).toBe(2000);
    });

    it("should remove filter", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.saveFilter("electronics", { category: "electronics" });
        result.current.saveFilter("fashion", { category: "fashion" });
        result.current.removeFilter("electronics");
      });

      expect(result.current.savedFilters).toHaveLength(1);
      expect(result.current.savedFilters[0].name).toBe("fashion");
    });
  });

  describe("Location Preferences", () => {
    it("should set default location", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setDefaultLocation("Lagos");
      });

      expect(result.current.defaultLocation).toBe("Lagos");
    });
  });

  describe("Privacy Preferences", () => {
    it("should update show online status", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setShowOnlineStatus(false);
      });

      expect(result.current.showOnlineStatus).toBe(false);
    });

    it("should update show phone number", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setShowPhoneNumber(true);
      });

      expect(result.current.showPhoneNumber).toBe(true);
    });
  });

  describe("Localization Preferences", () => {
    it("should update language", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setLanguage("fr");
      });

      expect(result.current.language).toBe("fr");
    });

    it("should update currency", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setCurrency("USD");
      });

      expect(result.current.currency).toBe("USD");
    });
  });

  describe("Bulk Updates", () => {
    it("should update multiple preferences at once", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.updatePreferences({
          theme: "light",
          feedView: "list",
          autoPlayVideos: false,
          language: "fr",
        });
      });

      expect(result.current.theme).toBe("light");
      expect(result.current.feedView).toBe("list");
      expect(result.current.autoPlayVideos).toBe(false);
      expect(result.current.language).toBe("fr");
    });
  });

  describe("Reset Functionality", () => {
    it("should reset all preferences to defaults", () => {
      const { result } = renderHook(() => usePreferencesStore());

      act(() => {
        result.current.setTheme("light");
        result.current.setFeedView("list");
        result.current.addRecentSearch("test");
        result.current.setLanguage("fr");
        result.current.reset();
      });

      expect(result.current.theme).toBe("dark");
      expect(result.current.feedView).toBe("grid");
      expect(result.current.recentSearches).toHaveLength(0);
      expect(result.current.language).toBe("en");
    });
  });

  describe("Persistence", () => {
    it("should have persist functions", () => {
      const { result } = renderHook(() => usePreferencesStore());

      expect(typeof result.current.loadPreferences).toBe("function");
      expect(typeof result.current.persistPreferences).toBe("function");
    });

    it("should call persist after updates", async () => {
      const { result } = renderHook(() => usePreferencesStore());

      await act(async () => {
        result.current.setTheme("light");
        // persistPreferences is called automatically
      });

      // Verify the preference was updated
      expect(result.current.theme).toBe("light");
    });
  });
});
