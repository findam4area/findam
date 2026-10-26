/**
 * Utility functions for managing search history in localStorage
 */

const SEARCH_HISTORY_KEY = "findam_search_history";
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];

    const history: SearchHistoryItem[] = JSON.parse(stored);
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Failed to get search history:", error);
    return [];
  }
}

/**
 * Add a search query to history
 */
export function addSearchToHistory(query: string): void {
  if (typeof window === "undefined") return;
  if (!query || query.trim().length === 0) return;

  try {
    const history = getRecentSearches();

    // Remove duplicate if exists
    const filtered = history.filter(
      (item) => item.query.toLowerCase() !== query.toLowerCase(),
    );

    // Add new search at the beginning
    const newHistory: SearchHistoryItem[] = [
      { query: query.trim(), timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error("Failed to add search to history:", error);
  }
}

/**
 * Remove a specific search from history
 */
export function removeSearchFromHistory(query: string): void {
  if (typeof window === "undefined") return;

  try {
    const history = getRecentSearches();
    const filtered = history.filter(
      (item) => item.query.toLowerCase() !== query.toLowerCase(),
    );
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove search from history:", error);
  }
}

/**
 * Clear all search history
 */
export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear search history:", error);
  }
}
