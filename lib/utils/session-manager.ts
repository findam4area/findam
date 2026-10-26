/**
 * Session State Manager
 * Handles session restoration, saved listings, and user preferences
 */

import {
  saveSessionState,
  getSessionState,
  clearSessionState,
  getSavedListings,
  saveListing,
  removeSavedListing,
} from "./offline-storage";
import { usePreferencesStore } from "@/store/preferences";
import { createClient } from "@/lib/supabase/client";

export interface SessionState {
  userId: string;
  lastActiveRoute?: string;
  scrollPositions?: Record<string, number>;
  searchHistory?: string[];
  filterState?: Record<string, any>;
  timestamp: number;
}

export interface SavedListing {
  id: string;
  title: string;
  price: number;
  thumbnail_url?: string;
  savedAt: number;
}

export class SessionManager {
  private static instance: SessionManager;
  private supabase = createClient();

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Save current session state
   */
  async saveSession(
    userId: string,
    state: Partial<SessionState>,
  ): Promise<void> {
    try {
      const sessionState: SessionState = {
        userId,
        lastActiveRoute: state.lastActiveRoute,
        scrollPositions: state.scrollPositions || {},
        searchHistory: state.searchHistory || [],
        filterState: state.filterState || {},
        timestamp: Date.now(),
      };

      await saveSessionState(`session_${userId}`, sessionState);
      console.log("Session state saved for user:", userId);
    } catch (error) {
      console.error("Failed to save session state:", error);
    }
  }

  /**
   * Restore session state on login
   */
  async restoreSession(userId: string): Promise<SessionState | null> {
    try {
      const sessionState = await getSessionState<SessionState>(
        `session_${userId}`,
      );

      if (sessionState) {
        console.log("Session state restored for user:", userId);
        return sessionState;
      }

      return null;
    } catch (error) {
      console.error("Failed to restore session state:", error);
      return null;
    }
  }

  /**
   * Clear session state on logout
   */
  async clearSession(userId?: string): Promise<void> {
    try {
      if (userId) {
        await saveSessionState(`session_${userId}`, null);
      } else {
        await clearSessionState();
      }
      console.log("Session state cleared");
    } catch (error) {
      console.error("Failed to clear session state:", error);
    }
  }

  /**
   * Save scroll position for a route
   */
  async saveScrollPosition(
    userId: string,
    route: string,
    position: number,
  ): Promise<void> {
    try {
      const sessionState = await this.restoreSession(userId);
      const scrollPositions = sessionState?.scrollPositions || {};
      scrollPositions[route] = position;

      await this.saveSession(userId, {
        ...sessionState,
        scrollPositions,
      });
    } catch (error) {
      console.error("Failed to save scroll position:", error);
    }
  }

  /**
   * Get scroll position for a route
   */
  async getScrollPosition(userId: string, route: string): Promise<number> {
    try {
      const sessionState = await this.restoreSession(userId);
      return sessionState?.scrollPositions?.[route] || 0;
    } catch (error) {
      console.error("Failed to get scroll position:", error);
      return 0;
    }
  }

  /**
   * Save a listing for offline access
   */
  async saveListingForOffline(listing: SavedListing): Promise<void> {
    try {
      await saveListing(listing.id, listing);
      console.log("Listing saved for offline access:", listing.id);
    } catch (error) {
      console.error("Failed to save listing:", error);
    }
  }

  /**
   * Get all saved listings
   */
  async getSavedListingsForOffline(): Promise<SavedListing[]> {
    try {
      return await getSavedListings();
    } catch (error) {
      console.error("Failed to get saved listings:", error);
      return [];
    }
  }

  /**
   * Remove a saved listing
   */
  async removeSavedListingFromOffline(listingId: string): Promise<void> {
    try {
      await removeSavedListing(listingId);
      console.log("Listing removed from offline storage:", listingId);
    } catch (error) {
      console.error("Failed to remove saved listing:", error);
    }
  }

  /**
   * Sync saved listings with server
   */
  async syncSavedListings(userId: string): Promise<void> {
    try {
      // Get saved listings from server
      const { data: serverSavedListings, error } = await this.supabase
        .from("user_saves")
        .select(
          `
          listing_id,
          listings (
            id,
            title,
            price,
            thumbnail_url
          )
        `,
        )
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to fetch saved listings from server:", error);
        return;
      }

      // Save to offline storage
      if (serverSavedListings) {
        for (const save of serverSavedListings) {
          if (save.listings) {
            const listing = Array.isArray(save.listings)
              ? save.listings[0]
              : save.listings;
            await this.saveListingForOffline({
              id: listing.id,
              title: listing.title,
              price: listing.price,
              thumbnail_url: listing.thumbnail_url,
              savedAt: Date.now(),
            });
          }
        }
      }

      console.log("Saved listings synced with server");
    } catch (error) {
      console.error("Failed to sync saved listings:", error);
    }
  }

  /**
   * Load user preferences on login
   */
  async loadUserPreferences(userId: string): Promise<void> {
    try {
      // Load preferences from Zustand store (which persists to localStorage)
      const preferencesStore = usePreferencesStore.getState();
      await preferencesStore.loadPreferences();

      console.log("User preferences loaded");
    } catch (error) {
      console.error("Failed to load user preferences:", error);
    }
  }

  /**
   * Complete session restoration on login
   */
  async restoreCompleteSession(userId: string): Promise<SessionState | null> {
    try {
      // Restore session state
      const sessionState = await this.restoreSession(userId);

      // Load user preferences
      await this.loadUserPreferences(userId);

      // Sync saved listings
      await this.syncSavedListings(userId);

      console.log("Complete session restored for user:", userId);
      return sessionState;
    } catch (error) {
      console.error("Failed to restore complete session:", error);
      return null;
    }
  }

  /**
   * Save current route for restoration
   */
  async saveCurrentRoute(userId: string, route: string): Promise<void> {
    try {
      const sessionState = await this.restoreSession(userId);
      await this.saveSession(userId, {
        ...sessionState,
        lastActiveRoute: route,
      });
    } catch (error) {
      console.error("Failed to save current route:", error);
    }
  }

  /**
   * Get last active route
   */
  async getLastActiveRoute(userId: string): Promise<string | null> {
    try {
      const sessionState = await this.restoreSession(userId);
      return sessionState?.lastActiveRoute || null;
    } catch (error) {
      console.error("Failed to get last active route:", error);
      return null;
    }
  }

  /**
   * Save search history
   */
  async saveSearchHistory(userId: string, query: string): Promise<void> {
    try {
      const sessionState = await this.restoreSession(userId);
      const searchHistory = sessionState?.searchHistory || [];

      // Add to beginning and limit to 10
      const updatedHistory = [
        query,
        ...searchHistory.filter((q) => q !== query),
      ].slice(0, 10);

      await this.saveSession(userId, {
        ...sessionState,
        searchHistory: updatedHistory,
      });
    } catch (error) {
      console.error("Failed to save search history:", error);
    }
  }

  /**
   * Get search history
   */
  async getSearchHistory(userId: string): Promise<string[]> {
    try {
      const sessionState = await this.restoreSession(userId);
      return sessionState?.searchHistory || [];
    } catch (error) {
      console.error("Failed to get search history:", error);
      return [];
    }
  }

  /**
   * Save filter state
   */
  async saveFilterState(
    userId: string,
    filterKey: string,
    filterValue: any,
  ): Promise<void> {
    try {
      const sessionState = await this.restoreSession(userId);
      const filterState = sessionState?.filterState || {};
      filterState[filterKey] = filterValue;

      await this.saveSession(userId, {
        ...sessionState,
        filterState,
      });
    } catch (error) {
      console.error("Failed to save filter state:", error);
    }
  }

  /**
   * Get filter state
   */
  async getFilterState(userId: string, filterKey: string): Promise<any> {
    try {
      const sessionState = await this.restoreSession(userId);
      return sessionState?.filterState?.[filterKey];
    } catch (error) {
      console.error("Failed to get filter state:", error);
      return null;
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
