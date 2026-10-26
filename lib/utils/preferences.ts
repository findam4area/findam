/**
 * User preferences storage using LocalStorage
 * Persists user settings across sessions
 */

import { LocalStorageCache } from "./cache";

export interface UserPreferences {
  theme?: "dark" | "light";
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
  language?: string;
  feedView?: "grid" | "list";
  autoPlayVideos?: boolean;
  dataMode?: "normal" | "saver";
  searchHistory?: string[];
  recentCategories?: string[];
}

const PREFERENCES_KEY = "findam:preferences";
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  notificationsEnabled: true,
  soundEnabled: true,
  language: "en",
  feedView: "grid",
  autoPlayVideos: true,
  dataMode: "normal",
  searchHistory: [],
  recentCategories: [],
};

/**
 * Get user preferences from LocalStorage
 */
export function getPreferences(): UserPreferences {
  const cached = LocalStorageCache.get<UserPreferences>(PREFERENCES_KEY);
  return cached || DEFAULT_PREFERENCES;
}

/**
 * Set user preferences in LocalStorage
 */
export function setPreferences(preferences: Partial<UserPreferences>): void {
  const current = getPreferences();
  const updated = { ...current, ...preferences };
  LocalStorageCache.set(PREFERENCES_KEY, updated, Infinity); // Never expire
}

/**
 * Update a single preference
 */
export function updatePreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K],
): void {
  const preferences = getPreferences();
  preferences[key] = value;
  setPreferences(preferences);
}

/**
 * Reset preferences to defaults
 */
export function resetPreferences(): void {
  LocalStorageCache.set(PREFERENCES_KEY, DEFAULT_PREFERENCES, Infinity);
}

/**
 * Add to search history (max 10 items)
 */
export function addToSearchHistory(query: string): void {
  const preferences = getPreferences();
  const history = preferences.searchHistory || [];

  // Remove duplicates and add to front
  const updated = [query, ...history.filter((q) => q !== query)].slice(0, 10);

  updatePreference("searchHistory", updated);
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  updatePreference("searchHistory", []);
}

/**
 * Add to recent categories (max 5 items)
 */
export function addToRecentCategories(categoryId: string): void {
  const preferences = getPreferences();
  const recent = preferences.recentCategories || [];

  // Remove duplicates and add to front
  const updated = [
    categoryId,
    ...recent.filter((id) => id !== categoryId),
  ].slice(0, 5);

  updatePreference("recentCategories", updated);
}

/**
 * Get preference value with fallback
 */
export function getPreference<K extends keyof UserPreferences>(
  key: K,
  fallback: UserPreferences[K],
): UserPreferences[K] {
  const preferences = getPreferences();
  return preferences[key] ?? fallback;
}
