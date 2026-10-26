/**
 * Hook for using session manager
 * Provides utilities for session state management
 */

import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth";
import { sessionManager, SessionState } from "@/lib/utils/session-manager";
import { usePathname } from "next/navigation";

export function useSessionManager() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  /**
   * Save current route when it changes
   */
  useEffect(() => {
    if (user?.id && pathname) {
      sessionManager.saveCurrentRoute(user.id, pathname);
    }
  }, [user?.id, pathname]);

  /**
   * Restore session on mount
   */
  useEffect(() => {
    if (user?.id) {
      restoreSession();
    }
  }, [user?.id]);

  /**
   * Restore complete session
   */
  const restoreSession = useCallback(async (): Promise<SessionState | null> => {
    if (!user?.id) return null;
    return await sessionManager.restoreCompleteSession(user.id);
  }, [user?.id]);

  /**
   * Save scroll position
   */
  const saveScrollPosition = useCallback(
    async (route: string, position: number): Promise<void> => {
      if (!user?.id) return;
      await sessionManager.saveScrollPosition(user.id, route, position);
    },
    [user?.id],
  );

  /**
   * Get scroll position
   */
  const getScrollPosition = useCallback(
    async (route: string): Promise<number> => {
      if (!user?.id) return 0;
      return await sessionManager.getScrollPosition(user.id, route);
    },
    [user?.id],
  );

  /**
   * Save search query
   */
  const saveSearchQuery = useCallback(
    async (query: string): Promise<void> => {
      if (!user?.id) return;
      await sessionManager.saveSearchHistory(user.id, query);
    },
    [user?.id],
  );

  /**
   * Get search history
   */
  const getSearchHistory = useCallback(async (): Promise<string[]> => {
    if (!user?.id) return [];
    return await sessionManager.getSearchHistory(user.id);
  }, [user?.id]);

  /**
   * Save filter state
   */
  const saveFilterState = useCallback(
    async (filterKey: string, filterValue: any): Promise<void> => {
      if (!user?.id) return;
      await sessionManager.saveFilterState(user.id, filterKey, filterValue);
    },
    [user?.id],
  );

  /**
   * Get filter state
   */
  const getFilterState = useCallback(
    async (filterKey: string): Promise<any> => {
      if (!user?.id) return null;
      return await sessionManager.getFilterState(user.id, filterKey);
    },
    [user?.id],
  );

  /**
   * Get last active route
   */
  const getLastActiveRoute = useCallback(async (): Promise<string | null> => {
    if (!user?.id) return null;
    return await sessionManager.getLastActiveRoute(user.id);
  }, [user?.id]);

  /**
   * Clear session
   */
  const clearSession = useCallback(async (): Promise<void> => {
    if (!user?.id) return;
    await sessionManager.clearSession(user.id);
  }, [user?.id]);

  return {
    restoreSession,
    saveScrollPosition,
    getScrollPosition,
    saveSearchQuery,
    getSearchHistory,
    saveFilterState,
    getFilterState,
    getLastActiveRoute,
    clearSession,
  };
}
