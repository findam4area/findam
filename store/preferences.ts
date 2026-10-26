import { create } from "zustand";
import { persist } from "zustand/middleware";
import { savePreference, getPreference } from "@/lib/utils/offline-storage";

export interface UserPreferences {
  // Display preferences
  theme: "dark" | "light";
  feedView: "grid" | "list";
  autoPlayVideos: boolean;

  // Notification preferences
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  messageNotifications: boolean;
  listingNotifications: boolean;

  // Search preferences
  recentSearches: string[];
  savedFilters: Record<string, any>[];
  defaultLocation?: string;

  // Privacy preferences
  showOnlineStatus: boolean;
  showPhoneNumber: boolean;

  // Other preferences
  language: string;
  currency: string;
}

interface PreferencesState extends UserPreferences {
  isLoaded: boolean;

  // Actions
  setTheme: (theme: "dark" | "light") => void;
  setFeedView: (view: "grid" | "list") => void;
  setAutoPlayVideos: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setEmailNotifications: (enabled: boolean) => void;
  setPushNotifications: (enabled: boolean) => void;
  setMessageNotifications: (enabled: boolean) => void;
  setListingNotifications: (enabled: boolean) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  saveFilter: (name: string, filter: any) => void;
  removeFilter: (name: string) => void;
  setDefaultLocation: (location: string) => void;
  setShowOnlineStatus: (show: boolean) => void;
  setShowPhoneNumber: (show: boolean) => void;
  setLanguage: (language: string) => void;
  setCurrency: (currency: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  loadPreferences: () => Promise<void>;
  persistPreferences: () => Promise<void>;
  reset: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: "dark",
  feedView: "grid",
  autoPlayVideos: true,
  notificationsEnabled: true,
  emailNotifications: true,
  pushNotifications: true,
  messageNotifications: true,
  listingNotifications: true,
  recentSearches: [],
  savedFilters: [],
  showOnlineStatus: true,
  showPhoneNumber: false,
  language: "en",
  currency: "NGN",
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      ...defaultPreferences,
      isLoaded: false,

      setTheme: (theme) => {
        set({ theme });
        get().persistPreferences();
      },

      setFeedView: (feedView) => {
        set({ feedView });
        get().persistPreferences();
      },

      setAutoPlayVideos: (autoPlayVideos) => {
        set({ autoPlayVideos });
        get().persistPreferences();
      },

      setNotificationsEnabled: (notificationsEnabled) => {
        set({ notificationsEnabled });
        get().persistPreferences();
      },

      setEmailNotifications: (emailNotifications) => {
        set({ emailNotifications });
        get().persistPreferences();
      },

      setPushNotifications: (pushNotifications) => {
        set({ pushNotifications });
        get().persistPreferences();
      },

      setMessageNotifications: (messageNotifications) => {
        set({ messageNotifications });
        get().persistPreferences();
      },

      setListingNotifications: (listingNotifications) => {
        set({ listingNotifications });
        get().persistPreferences();
      },

      addRecentSearch: (query) => {
        set((state) => {
          const searches = [
            query,
            ...state.recentSearches.filter((s) => s !== query),
          ].slice(0, 10);
          return { recentSearches: searches };
        });
        get().persistPreferences();
      },

      clearRecentSearches: () => {
        set({ recentSearches: [] });
        get().persistPreferences();
      },

      saveFilter: (name, filter) => {
        set((state) => ({
          savedFilters: [
            ...state.savedFilters.filter((f: any) => f.name !== name),
            { name, ...filter },
          ],
        }));
        get().persistPreferences();
      },

      removeFilter: (name) => {
        set((state) => ({
          savedFilters: state.savedFilters.filter((f: any) => f.name !== name),
        }));
        get().persistPreferences();
      },

      setDefaultLocation: (defaultLocation) => {
        set({ defaultLocation });
        get().persistPreferences();
      },

      setShowOnlineStatus: (showOnlineStatus) => {
        set({ showOnlineStatus });
        get().persistPreferences();
      },

      setShowPhoneNumber: (showPhoneNumber) => {
        set({ showPhoneNumber });
        get().persistPreferences();
      },

      setLanguage: (language) => {
        set({ language });
        get().persistPreferences();
      },

      setCurrency: (currency) => {
        set({ currency });
        get().persistPreferences();
      },

      updatePreferences: (preferences) => {
        set(preferences);
        get().persistPreferences();
      },

      loadPreferences: async () => {
        try {
          const stored =
            await getPreference<UserPreferences>("user_preferences");
          if (stored) {
            set({ ...stored, isLoaded: true });
          } else {
            set({ isLoaded: true });
          }
        } catch (error) {
          console.error("Failed to load preferences:", error);
          set({ isLoaded: true });
        }
      },

      persistPreferences: async () => {
        try {
          const state = get();
          const preferences: UserPreferences = {
            theme: state.theme,
            feedView: state.feedView,
            autoPlayVideos: state.autoPlayVideos,
            notificationsEnabled: state.notificationsEnabled,
            emailNotifications: state.emailNotifications,
            pushNotifications: state.pushNotifications,
            messageNotifications: state.messageNotifications,
            listingNotifications: state.listingNotifications,
            recentSearches: state.recentSearches,
            savedFilters: state.savedFilters,
            defaultLocation: state.defaultLocation,
            showOnlineStatus: state.showOnlineStatus,
            showPhoneNumber: state.showPhoneNumber,
            language: state.language,
            currency: state.currency,
          };
          await savePreference("user_preferences", preferences);
        } catch (error) {
          console.error("Failed to persist preferences:", error);
        }
      },

      reset: () => {
        set({ ...defaultPreferences, isLoaded: true });
        get().persistPreferences();
      },
    }),
    {
      name: "preferences-storage",
      partialize: (state) => ({
        theme: state.theme,
        feedView: state.feedView,
        autoPlayVideos: state.autoPlayVideos,
        notificationsEnabled: state.notificationsEnabled,
        emailNotifications: state.emailNotifications,
        pushNotifications: state.pushNotifications,
        messageNotifications: state.messageNotifications,
        listingNotifications: state.listingNotifications,
        recentSearches: state.recentSearches,
        savedFilters: state.savedFilters,
        defaultLocation: state.defaultLocation,
        showOnlineStatus: state.showOnlineStatus,
        showPhoneNumber: state.showPhoneNumber,
        language: state.language,
        currency: state.currency,
      }),
    },
  ),
);
