/**
 * React hook for managing user preferences
 */

import { useState, useEffect, useCallback } from "react";
import {
  getPreferences,
  setPreferences,
  updatePreference,
  type UserPreferences,
} from "@/lib/utils/preferences";

export function usePreferences() {
  const [preferences, setPreferencesState] =
    useState<UserPreferences>(getPreferences());

  // Sync with localStorage on mount
  useEffect(() => {
    setPreferencesState(getPreferences());
  }, []);

  // Update a single preference
  const update = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      updatePreference(key, value);
      setPreferencesState(getPreferences());
    },
    [],
  );

  // Update multiple preferences
  const updateMany = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(updates);
    setPreferencesState(getPreferences());
  }, []);

  // Reset to defaults
  const reset = useCallback(() => {
    setPreferences({
      theme: "dark",
      notificationsEnabled: true,
      soundEnabled: true,
      language: "en",
      feedView: "grid",
      autoPlayVideos: true,
      dataMode: "normal",
      searchHistory: [],
      recentCategories: [],
    });
    setPreferencesState(getPreferences());
  }, []);

  return {
    preferences,
    update,
    updateMany,
    reset,
  };
}
